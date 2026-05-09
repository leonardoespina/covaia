from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
import asyncio

# Importar nuestros nuevos módulos de IA
from app.classifier import clasificar
from app.risk_engine import calcular_riesgo
from app.pattern_detector import detectar_patron
from app.summarizer import generar_resumen
from app.chat_engine import procesar_pregunta
from app.doc_qa import indexar_documentos
from app.gemini_client import init_gemini

app = FastAPI(
    title="COVA-AI Engine",
    description="Motor de Inteligencia Artificial para el Sistema COVA-AI",
    version="1.2.0"
)

@app.on_event("startup")
async def startup_event():
    indexar_documentos()
    init_gemini()

class ReporteInput(BaseModel):
    descripcion: str
    latitud: float | None = None
    longitud: float | None = None
    tipo_evento: str | None = None
    unidad_id: str | None = None

class AnalisisOutput(BaseModel):
    categoria: str
    nivel_riesgo: str
    confianza: float
    patron_detectado: bool
    resumen_ia: str
    timestamp: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "COVA-AI Engine", "timestamp": datetime.now().isoformat()}

@app.post("/analyze", response_model=AnalisisOutput)
async def analyze_report(reporte: ReporteInput):
    """
    Endpoint principal del Agente de IA.
    Ejecuta el pipeline completo: Clasificación ML -> Patrones Geoespaciales -> Riesgo -> Resumen
    """
    # 0. Simulamos un pequeño retraso para que en la UI se vea el estado "IA Analizando..."
    await asyncio.sleep(1.5)

    # 1. CLASIFICACIÓN (TF-IDF + Naive Bayes)
    resultado_clasificacion = clasificar(reporte.descripcion)
    categoria = resultado_clasificacion["categoria"]
    confianza = resultado_clasificacion["confianza"]

    # 2. PATRONES GEOESPACIALES (PostGIS)
    patron_detectado = False
    conteo_patron = 0
    if reporte.latitud is not None and reporte.longitud is not None:
        # Buscamos en radio de 5km en las últimas 72h
        patron_detectado, conteo_patron = detectar_patron(
            lat=reporte.latitud, 
            lon=reporte.longitud, 
            radio_km=5.0, 
            horas=72
        )

    # 3. MOTOR DE RIESGO (Escalamiento)
    nivel_riesgo = calcular_riesgo(
        categoria=categoria,
        confianza=confianza,
        patron_detectado=patron_detectado,
        conteo_patron=conteo_patron
    )

    # 4. GENERACIÓN DE RESUMEN (Contextual)
    resumen_ia = generar_resumen(
        descripcion=reporte.descripcion,
        categoria=categoria,
        nivel_riesgo=nivel_riesgo,
        confianza=confianza,
        patron_detectado=patron_detectado,
        conteo_patron=conteo_patron
    )

    return AnalisisOutput(
        categoria=categoria,
        nivel_riesgo=nivel_riesgo,
        confianza=confianza,
        patron_detectado=patron_detectado,
        resumen_ia=resumen_ia,
        timestamp=datetime.now().isoformat()
    )

class ChatInput(BaseModel):
    mensaje: str
    contexto: str = 'sistema'  # Valores: 'sistema', 'ley', 'manual'

@app.post("/chat")
async def chat_endpoint(data: ChatInput):
    """
    Recibe un mensaje y el contexto seleccionado por el usuario.
    Enruta la consulta al motor SQL (sistema) o al motor documental (ley/manual).
    """
    await asyncio.sleep(0.8)
    respuesta = procesar_pregunta(data.mensaje, data.contexto)
    return { "respuesta": respuesta }
