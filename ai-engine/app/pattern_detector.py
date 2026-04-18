"""
COVA-AI: Detector de Patrones Espacio-Temporales
Consulta la BD para identificar si la nueva alerta es parte de una cadena
de eventos recurrentes en la misma zona durante las últimas 72 horas.
"""
import os
import psycopg2
from typing import Tuple

def _get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "db"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        dbname=os.getenv("POSTGRES_DB", "cova_ai_db"),
        user=os.getenv("POSTGRES_USER", "cova_admin"),
        password=os.getenv("POSTGRES_PASSWORD", "CovaSecure2026!")
    )

def detectar_patron(lat: float, lon: float, radio_km: float = 5.0, horas: int = 72) -> Tuple[bool, int]:
    """
    Busca eventos cercanos en el tiempo y el espacio.
    Requiere PostGIS activo en PostgreSQL (`coordenadas GEOGRAPHY(Point, 4326)`).
    
    Retorna: (patron_detectado, conteo_de_alertas_previas)
    """
    if lat is None or lon is None:
        return False, 0

    try:
        conn = _get_db_connection()
        cur = conn.cursor()

        # Query espacial usando PostGIS: ST_DWithin
        # ST_SetSRID(ST_MakePoint(lon, lat), 4326): Crea el punto de la alerta actual.
        # ST_DWithin compara en metros si es tipo GEOGRAPHY, así que radio_km * 1000
        query = f"""
            SELECT COUNT(a.id)
            FROM alertas a
            JOIN reportes_patrulla r ON a.reporte_id = r.id
            WHERE r.coordenadas IS NOT NULL
              AND a.created_at >= NOW() - INTERVAL '{horas} HOURS'
              AND ST_DWithin(
                  r.coordenadas, 
                  ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, 
                  %s
              );
        """
        # Excluimos la alerta actual comparando tiempos, pero como
        # esta comprobación corre ANTES de crear la alerta, no se incluirá a sí misma.

        metros = radio_km * 1000
        cur.execute(query, (lon, lat, metros))
        resultado = cur.fetchone()
        
        conteo = resultado[0] if resultado else 0
        patron = conteo > 0 # Si hay al menos 1 alerta previa, ya es un patrón

        cur.close()
        conn.close()

        return patron, conteo

    except Exception as e:
        print(f"⚠️ Error en pattern_detector: {e}")
        return False, 0
