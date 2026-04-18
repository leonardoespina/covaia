"""
COVA-AI: Motor de Cálculo de Riesgo
Determina el nivel de riesgo final combinando la categoría, la confianza del
clasificador y la detección de patrones de recurrencia geoespacial.
"""

# Nivel base por categoría
RIESGO_BASE = {
    "INTRUSION_ARMADA": "CRITICO",
    "MINERIA_ILEGAL":   "ALTO",
    "CONTRABANDO":      "MEDIO",
    "SIN_NOVEDAD":      "BAJO",
}

ESCALAS = ["BAJO", "MEDIO", "ALTO", "CRITICO"]

def _escalar(nivel: str, pasos: int = 1) -> str:
    idx = ESCALAS.index(nivel)
    return ESCALAS[min(idx + pasos, len(ESCALAS) - 1)]

def calcular_riesgo(categoria: str, confianza: float, patron_detectado: bool,
                    conteo_patron: int = 0) -> str:
    """
    Calcula el nivel de riesgo final.

    Lógica de escalamiento:
    - Riesgo base según categoría
    - Si el clasificador tiene baja confianza (<55%), baja 1 nivel
    - Si se detectó patrón (2-4 alertas en 72h), sube 1 nivel
    - Si el patrón es severo (5+ alertas), sube 2 niveles (zona caliente)
    """
    nivel = RIESGO_BASE.get(categoria, "BAJO")

    # Baja si la confianza es muy baja (el modelo dudó mucho)
    if confianza < 55 and nivel != "BAJO":
        idx = ESCALAS.index(nivel)
        nivel = ESCALAS[max(idx - 1, 0)]

    # Escala por patrón de recurrencia
    if patron_detectado:
        if conteo_patron >= 5:
            nivel = _escalar(nivel, 2)   # Zona caliente: +2
        else:
            nivel = _escalar(nivel, 1)   # Zona de alerta: +1

    return nivel
