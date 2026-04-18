"""
COVA-AI: Motor Analítico Conversacional (Text-to-SQL MVP)
Convierte lenguaje natural simple a consultas SQL directas en PostgreSQL.
"""
import os
import re
import psycopg2

def _get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "db"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        dbname=os.getenv("POSTGRES_DB", "cova_ai_db"),
        user=os.getenv("POSTGRES_USER", "cova_admin"),
        password=os.getenv("POSTGRES_PASSWORD", "CovaSecure2026!")
    )

def procesar_pregunta(mensaje: str) -> str:
    """Clasifica la palabra clave del mensaje, realiza la query SQL y retorna la redacción"""
    texto = mensaje.lower().strip()
    
    try:
        conn = _get_db_connection()
        cur = conn.cursor()
        
        # 1. Intención: Alertas Críticas
        if re.search(r'\bcriticas\b|\bcritico\b|\bcríticas\b|\bcrítico\b', texto):
            cur.execute("SELECT COUNT(*) FROM alertas WHERE nivel_riesgo = 'CRITICO';")
            conteo = cur.fetchone()[0]
            conn.close()
            return f"Comandante, revisando la base de datos táctica, actualmente tenemos **{conteo} alertas confirmadas con nivel CRÍTICO** en su jurisdicción."
            
        # 2. Intención: Deforestación / Minería
        elif re.search(r'\bdeforestacion\b|\bdeforestación\b|\bmineria\b|\bminería\b', texto):
            cur.execute("SELECT COUNT(*) FROM alertas WHERE categoria IN ('DEFORESTACION', 'MINERIA_ILEGAL');")
            conteo = cur.fetchone()[0]
            conn.close()
            return f"De acuerdo a los sensores y reportes de patrulla acumulados, existen **{conteo} incidentes registrados sobre Deforestación y Minería Ilegal** activos."
            
        # 3. Intención: Total de Alertas
        elif re.search(r'\bcuantas alertas\b|\btotal\b', texto):
            cur.execute("SELECT COUNT(*) FROM alertas;")
            conteo = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM alertas WHERE estado = 'RESUELTA';")
            resueltas = cur.fetchone()[0]
            conn.close()
            return f"El inventario completo indica que el sistema ha procesado **{conteo} alertas totales**. De estas, **{resueltas}** ya han sido resueltas por las unidades operativas."
            
        # 4. Fallback (General)
        else:
            conn.close()
            return "Comandante, mi capacidad actual está calibrada para consultar recuentos de alertas (críticas, deforestación, totales). Por favor reescriba su comando."
            
    except Exception as e:
        print(f"Error procesando chat SQL: {e}")
        return "Se produjo un error al establecer enlace temporal con la base de datos central (COVA DB)."
