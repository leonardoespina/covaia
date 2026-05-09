"""
COVA-AI: Cliente Gemini para Respuestas Contextuales Legales
Recibe fragmentos de documentos y redacta respuestas naturales en español táctico-militar.
"""
import os

_model = None

def init_gemini():
    """Inicializa el cliente Gemini al arrancar el servidor."""
    global _model
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("⚠️  GEMINI_API_KEY no configurada. El chat usará el modo RAG básico.")
        return
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel("gemini-1.5-flash")
        print("✅ Motor Gemini inicializado correctamente (gemini-1.5-flash).")
    except ImportError:
        print("⚠️  Librería google-generativeai no instalada. Se usará el modo RAG básico.")
        _model = None
    except Exception as e:
        print(f"⚠️  No se pudo inicializar Gemini: {e}. Se usará el modo RAG básico.")
        _model = None


def generar_respuesta_legal(pregunta: str, articulos: list[str], nombre_fuente: str) -> str | None:
    """
    Genera una respuesta natural en español a partir de la pregunta del usuario
    y los artículos extraídos del documento local.
    
    Retorna None si Gemini no está disponible, para que el sistema caiga al modo RAG.
    
    Args:
        pregunta: La pregunta formulada por el usuario.
        articulos: Lista con los fragmentos del documento más relevantes (top 3).
        nombre_fuente: Nombre del archivo fuente (ej: "ley.pdf", "manual minero.docx").
    """
    if _model is None:
        return None

    contexto = "\n\n---\n\n".join(articulos)

    prompt = f"""Eres el Sistema Experto de Inteligencia del Resguardo Nacional Minero (ZODI 62).
Tu función es asesorar al personal de mando en materia legal y procedimental.

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE basándote en los extractos del documento que se te proporcionan.
2. Si la respuesta no está en los extractos, indícalo claramente.
3. Cita el número de artículo cuando lo identifiques en el texto.
4. Usa un tono formal pero comprensible para personal militar.
5. Responde en español. Sé conciso (máximo 5 oraciones).
6. NUNCA inventes leyes, artículos o procedimientos que no estén en el texto.

DOCUMENTO FUENTE: {nombre_fuente}

EXTRACTOS RELEVANTES:
{contexto}

PREGUNTA DEL COMANDANTE: {pregunta}

RESPUESTA:"""

    try:
        response = _model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"⚠️  Error en llamada a Gemini: {e}")
        return None
