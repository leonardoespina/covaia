import os
import glob
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import PyPDF2
import docx

DOCS_DIR = os.path.join(os.path.dirname(__file__), "docs")

vectorizer = None
tfidf_matrix = None
document_chunks = []
chunk_sources = []

def extract_text_from_pdf(filepath):
    text = ""
    try:
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"Error leyendo PDF {filepath}: {e}")
    return text

def extract_text_from_docx(filepath):
    text = ""
    try:
        doc = docx.Document(filepath)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error leyendo DOCX {filepath}: {e}")
    return text

def extract_text_from_txt(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except:
        try:
            with open(filepath, 'r', encoding='latin-1') as f:
                return f.read()
        except Exception as e:
            print(f"Error leyendo TXT {filepath}: {e}")
            return ""

def _chunkear_documento(text, filename):
    """
    Chunking artículo-consciente:
    - Si el documento tiene estructura de artículos (Artículo XX.), cada artículo es un chunk independiente.
    - Si no, usa chunking por párrafos de ~600 caracteres.
    Esto garantiza que un artículo nunca quede cortado a la mitad.
    """
    chunks = []
    sources = []

    # Intentar dividir por patrón legal: "Artículo 1.", "Artículo 36°", etc.
    articulo_pattern = re.compile(r'(?=Art[ií]culo\s+\d+)', re.IGNORECASE)
    partes = articulo_pattern.split(text)

    if len(partes) > 2:
        # El documento tiene estructura de artículos
        for articulo in partes:
            articulo = articulo.strip()
            if len(articulo) < 30:
                continue

            if len(articulo) <= 1500:
                # Artículo normal: chunk completo
                chunks.append(articulo)
                sources.append(filename)
            else:
                # Artículo muy largo: dividir manteniendo el encabezado
                header_match = re.match(r'(Art[ií]culo\s+\d+[°.]?[^\n]*)', articulo, re.IGNORECASE)
                header = header_match.group(0).strip() + ". " if header_match else ""
                rest = articulo[len(header):]
                sentences = re.split(r'(?<=[.!?])\s+', rest)
                sub_chunk = header
                for s in sentences:
                    sub_chunk += s + " "
                    if len(sub_chunk) > 1000:
                        chunks.append(sub_chunk.strip())
                        sources.append(filename)
                        sub_chunk = header  # Repetir encabezado para contexto
                if len(sub_chunk) > len(header) + 20:
                    chunks.append(sub_chunk.strip())
                    sources.append(filename)
    else:
        # Sin estructura de artículos — chunking por párrafos
        raw_paragraphs = re.split(r'\n+', text)
        current_chunk = ""
        for p in raw_paragraphs:
            p = p.strip()
            if not p:
                continue
            current_chunk += p + " "
            if len(current_chunk) > 600:
                chunks.append(current_chunk.strip())
                sources.append(filename)
                current_chunk = ""
        if len(current_chunk) > 50:
            chunks.append(current_chunk.strip())
            sources.append(filename)

    return chunks, sources


def indexar_documentos():
    global vectorizer, tfidf_matrix, document_chunks, chunk_sources

    document_chunks = []
    chunk_sources = []

    if not os.path.exists(DOCS_DIR):
        os.makedirs(DOCS_DIR)

    archivos = glob.glob(os.path.join(DOCS_DIR, "*.*"))
    archivos = [f for f in archivos if f.endswith(('.txt', '.pdf', '.docx'))]

    print(f"📚 Iniciando indexación de la Base de Conocimiento... Encontrados {len(archivos)} documentos.")

    for filepath in archivos:
        filename = os.path.basename(filepath)
        text = ""
        if filepath.endswith('.pdf'):
            text = extract_text_from_pdf(filepath)
        elif filepath.endswith('.docx'):
            text = extract_text_from_docx(filepath)
        elif filepath.endswith('.txt'):
            text = extract_text_from_txt(filepath)

        chunks, sources = _chunkear_documento(text, filename)
        document_chunks.extend(chunks)
        chunk_sources.extend(sources)

    if document_chunks:
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(document_chunks)
        print(f"✅ Base de conocimiento lista: {len(document_chunks)} fragmentos indexados correctamente.")
    else:
        print("⚠️ Base de conocimiento vacía. Coloque archivos .txt, .pdf o .docx en la carpeta 'docs'.")


def _buscar_articulo_exacto(numero_str, indices_validos):
    """
    Si el usuario pide un artículo específico por número,
    devuelve el chunk completo que COMIENCE con ese artículo.
    """
    patron = re.compile(rf'Art[ií]culo\s+{numero_str}[°.\s]', re.IGNORECASE)
    for i in indices_validos:
        if patron.search(document_chunks[i]):
            fuente = chunk_sources[i]
            fragmento = document_chunks[i]
            return (
                f"Consultando **{fuente}** — **Artículo {numero_str}** (texto completo):\n\n"
                f"> *\"{fragmento}\"*"
            )
    return None


def buscar_en_documentos(pregunta: str, filtro_fuente: str = None) -> str:
    """
    Pipeline RAG Híbrido:
    1. TF-IDF recupera los top-3 artículos más relevantes del documento filtrado.
    2. Gemini redacta una respuesta contextual basada en esos artículos.
    3. Si Gemini no está disponible, devuelve el artículo más relevante directamente (fallback).
    """
    from app.gemini_client import generar_respuesta_legal
    global vectorizer, tfidf_matrix, document_chunks, chunk_sources

    if not document_chunks or vectorizer is None:
        return "Comandante, la Base de Conocimiento Táctica actualmente está vacía. Es necesario subir archivos al directorio de documentos."

    # ─── FILTRADO POR FUENTE (Visión de Túnel) ────────────────────────────────
    if filtro_fuente:
        indices_validos = [
            i for i, src in enumerate(chunk_sources)
            if filtro_fuente.lower() in src.lower()
        ]
        if not indices_validos:
            nombre_doc = 'ley.pdf' if filtro_fuente == 'ley' else 'manual minero'
            return f"Comandante, no se encontró el documento **{nombre_doc}** en la base de conocimiento. Verifique que el archivo se encuentre en la carpeta `docs`."
    else:
        indices_validos = list(range(len(document_chunks)))

    # ─── DETECCIÓN DE ARTÍCULO ESPECÍFICO POR NÚMERO ─────────────────────────
    articulo_match = re.search(r'art[ií]culo\s+(\d+)|art\.\s*(\d+)', pregunta, re.IGNORECASE)
    if articulo_match:
        numero = articulo_match.group(1) or articulo_match.group(2)
        resultado_exacto = _buscar_articulo_exacto(numero, indices_validos)
        if resultado_exacto:
            return resultado_exacto

    # ─── BÚSQUEDA TF-IDF: TOP-3 FRAGMENTOS ───────────────────────────────────
    query_vec = vectorizer.transform([pregunta])
    tfidf_filtrada = tfidf_matrix[indices_validos]
    similitudes = cosine_similarity(query_vec, tfidf_filtrada).flatten()

    # Obtener los índices de los 3 fragmentos con mayor puntaje
    top_n = min(3, len(indices_validos))
    top_local_indices = similitudes.argsort()[::-1][:top_n]
    top_scores = similitudes[top_local_indices]

    if top_scores[0] < 0.05:
        return "Comandante, no encontré información suficientemente relevante para su consulta dentro de este documento. Intente reformular su pregunta con términos más específicos."

    # Reunir los fragmentos relevantes y el nombre del documento fuente
    fragmentos_top = [document_chunks[indices_validos[i]] for i in top_local_indices if similitudes[i] >= 0.03]
    fuente_principal = chunk_sources[indices_validos[top_local_indices[0]]]

    # ─── GEMINI: REDACCIÓN CONTEXTUAL ─────────────────────────────────────────
    respuesta_gemini = generar_respuesta_legal(pregunta, fragmentos_top, fuente_principal)
    if respuesta_gemini:
        return respuesta_gemini

    # ─── FALLBACK: RAG BÁSICO (si Gemini no está disponible) ─────────────────
    fragmento = fragmentos_top[0]
    respuesta = (
        f"Consultando **{fuente_principal}**, encontré el siguiente extracto relevante:\n\n"
        f"> *\"{fragmento}\"*\n\n"
        f"_(Coincidencia léxica: {int(top_scores[0]*100)}% — Modo RAG básico)_"
    )
    return respuesta
