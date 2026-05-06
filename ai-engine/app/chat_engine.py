"""
COVA-AI: Motor Analítico Conversacional — Sistema de Enrutamiento por Contexto
Enruta las consultas al motor SQL (sistema) o al motor documental (ley/manual)
basándose exclusivamente en el contexto seleccionado por el usuario en el Frontend.
"""
import os
import re
import psycopg2
from app.doc_qa import buscar_en_documentos

def _get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "db"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        dbname=os.getenv("POSTGRES_DB", "cova_ai_db"),
        user=os.getenv("POSTGRES_USER", "cova_admin"),
        password=os.getenv("POSTGRES_PASSWORD", "CovaSecure2026!"),
        sslmode=os.getenv("DB_SSL_MODE", "disable" if os.getenv("POSTGRES_HOST", "db") == "db" else "require")
    )

def procesar_pregunta(mensaje: str, contexto: str = 'sistema') -> str:
    """
    Enruta la consulta exclusivamente por contexto:
    - 'ley'    -> Motor documental filtrado a ley.pdf
    - 'manual' -> Motor documental filtrado a manual minero
    - 'sistema'-> Motor SQL sobre la base de datos de alertas
    """
    
    # ─── CONTEXTO: DOCUMENTOS LEGALES ─────────────────────────────────────────
    if contexto == 'ley':
        return buscar_en_documentos(mensaje, filtro_fuente='ley')
    
    if contexto == 'manual':
        return buscar_en_documentos(mensaje, filtro_fuente='manual')
    
    # ─── CONTEXTO: BASE DE DATOS OPERATIVA (SQL) ──────────────────────────────
    texto = mensaje.lower().strip()
    
    try:
        conn = _get_db_connection()
        cur = conn.cursor()
        
        # Intención: Alertas Críticas
        if re.search(r'\bcriticas\b|\bcritico\b|\bcríticas\b|\bcrítico\b', texto):
            cur.execute("SELECT COUNT(*) FROM alertas WHERE nivel_riesgo = 'CRITICO';")
            conteo = cur.fetchone()[0]
            conn.close()
            return f"Comandante, revisando la base de datos táctica, actualmente tenemos **{conteo} alertas confirmadas con nivel CRÍTICO** en su jurisdicción."
            
        # Intención: Deforestación / Minería
        elif re.search(r'\bdeforestacion\b|\bdeforestación\b|\bmineria\b|\bminería\b', texto):
            cur.execute("SELECT COUNT(*) FROM alertas WHERE categoria IN ('DEFORESTACION', 'MINERIA_ILEGAL');")
            conteo = cur.fetchone()[0]
            conn.close()
            return f"De acuerdo a los sensores y reportes de patrulla acumulados, existen **{conteo} incidentes registrados sobre Deforestación y Minería Ilegal** activos."
            
        # Intención: Total de Alertas
        elif re.search(r'\bcuantas alertas\b|\btotal\b|\btodas\b', texto):
            cur.execute("SELECT COUNT(*) FROM alertas;")
            conteo = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM alertas WHERE estado = 'RESUELTA';")
            resueltas = cur.fetchone()[0]
            conn.close()
            return f"El inventario completo indica que el sistema ha procesado **{conteo} alertas totales**. De estas, **{resueltas}** ya han sido resueltas por las unidades operativas."
            
        # Fallback SQL
        else:
            conn.close()
            return "Comandante, en el módulo operativo puedo consultarle: cantidad de alertas **críticas**, alertas por **deforestación o minería**, y el **total** de alertas del sistema."
            
    except Exception as e:
        error_msg = str(e)
        print(f"Error procesando chat SQL: {error_msg}")
        return f"Se produjo un error al establecer enlace temporal con la base de datos central (COVA DB).\nDetalle técnico: {error_msg}"
