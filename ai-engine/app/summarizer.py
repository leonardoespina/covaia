"""
COVA-AI: Generador de Resúmenes
Transforma el análisis técnico en un resumen ejecutivo para el Comandante.
"""

def generar_resumen(descripcion: str, categoria: str, nivel_riesgo: str, 
                    confianza: float, patron_detectado: bool, conteo_patron: int) -> str:
    """
    Genera un párrafo humano entendible con los hallazgos de la IA.
    """
    
    # 1. Frase de apertura categórica
    cat_texto = categoria.replace('_', ' ').lower()
    
    if categoria == "SIN_NOVEDAD":
        return "El Agente COVA-AI ha analizado el reporte y determina que las operaciones continúan con normalidad, sin amenazas detectadas en la zona."
        
    resumen = f"El Agente COVA-AI ha clasificado este reporte como un posible evento de {cat_texto} con un nivel de riesgo "
    
    # Riqueza léxica según nivel
    if nivel_riesgo == "CRITICO":
        resumen += "CRÍTICO y prioridad inmediata de atención. "
    elif nivel_riesgo == "ALTO":
        resumen += "ALTO, requiriendo revisión por el Oficial de Guardia. "
    else:
        resumen += f"{nivel_riesgo}. "
        
    # 2. Confianza del modelo
    if confianza > 85:
        resumen += f"Alta confianza algorítmica ({confianza}% de coincidencia con perfiles de amenaza). "
    elif confianza < 55:
        resumen += "Advertencia: Ambigüedad detectada en la descripción, se sugiere validación humana. "

    # 3. Contextualización geoespacial (patrón)
    if patron_detectado:
        texto_frecuencia = "alta frecuencia" if conteo_patron >= 3 else "eventos similares"
        resumen += f"⚠️ ALERTA DE PATRÓN: Se identificó una anomalía espacial. Se han registrado {conteo_patron} alertas de {texto_frecuencia} " \
                   f"en un radio de 5km durante las últimas 72 horas (Zona Caliente)."
                   
    return resumen.strip()
