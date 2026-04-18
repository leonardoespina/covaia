"""
COVA-AI: Módulo Clasificador de Amenazas
Usa TF-IDF + Naive Bayes entrenado con reportes militares sintéticos.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
import numpy as np
import re

# ─────────────────────────────────────────────────────────────────────────────
# DATOS DE ENTRENAMIENTO SINTÉTICOS (reportes militares en español)
# En producción, reemplazar con reportes reales validados por la ZODI N°62
# ─────────────────────────────────────────────────────────────────────────────
TRAINING_DATA = [
    # MINERIA_ILEGAL
    ("Se observó operación de minería ilegal con draga en el río Cuyuní", "MINERIA_ILEGAL"),
    ("Detectamos motores de extracción ilegal activos a 2km del puesto", "MINERIA_ILEGAL"),
    ("Avistamiento de draga operando sin permiso en zona protegida", "MINERIA_ILEGAL"),
    ("Personal civil realizando extracción de oro sin autorización", "MINERIA_ILEGAL"),
    ("Se encontró campamento minero ilegal con 15 personas y equipos", "MINERIA_ILEGAL"),
    ("Retroexcavadora trabajando en zona de exclusión minera", "MINERIA_ILEGAL"),
    ("Mineros ilegales detenidos con mercurio y material de extracción", "MINERIA_ILEGAL"),
    ("Operación minera clandestina detectada en afluente del Orinoco", "MINERIA_ILEGAL"),
    ("Motor de barco tipo draga navegando en área restringida al norte", "MINERIA_ILEGAL"),
    ("Campamento con equipos de minería ilegal y personal armado menor", "MINERIA_ILEGAL"),
    ("Se observaron excavaciones ilegales en zona de reserva forestal", "MINERIA_ILEGAL"),
    ("Trabajadores ilegales extrayendo mineral sin documentación oficial", "MINERIA_ILEGAL"),
    ("Actividad de barequeo ilegal detectada en ribera del río", "MINERIA_ILEGAL"),
    ("Interceptado vehículo con material de extracción minera sin permiso", "MINERIA_ILEGAL"),
    ("Maquinaria pesada operando ilegalmente en zona protegida ZODI", "MINERIA_ILEGAL"),
    ("Denuncia de vecinos sobre ruido de maquinaria minera nocturna", "MINERIA_ILEGAL"),
    ("Patrulla detectó pozos de extracción recientes en área boscosa", "MINERIA_ILEGAL"),
    ("Avión de reconocimiento detectó humo de procesamiento minero ilegal", "MINERIA_ILEGAL"),
    ("Grupo de 30 personas con equipos de minería en sector intervenido", "MINERIA_ILEGAL"),
    ("Hallazgo de piscinas de lixiviación con cianuro en zona restringida", "MINERIA_ILEGAL"),
    ("BAMIN detectó operación de minería coltan sin autorización estatal", "MINERIA_ILEGAL"),
    ("Extracción ilegal de diamantes reportada en sector sur del río", "MINERIA_ILEGAL"),
    ("Motor fuera de borda y equipos de buceo para minería submarina", "MINERIA_ILEGAL"),
    ("Personal extranjero con equipos de prospección minera no autorizada", "MINERIA_ILEGAL"),
    ("Procesadora de mineral ilegal encontrada en zona selvática", "MINERIA_ILEGAL"),
    ("Ruidos fuertes de maquinaria y extracción detectada en la noche", "MINERIA_ILEGAL"),
    ("Grupo armado protegiendo operación minera ilegal en el sector", "MINERIA_ILEGAL"),
    ("Piscinas de procesado ilegal con mercurio encontradas en ribera", "MINERIA_ILEGAL"),
    ("Cuadrilla de 40 mineros ilegales con dragas en afluente sur", "MINERIA_ILEGAL"),
    ("Drones captaron extracción activa en zona de reserva protegida", "MINERIA_ILEGAL"),

    # INTRUSION_ARMADA
    ("Se detectó grupo armado con fusiles AK cruzando la frontera", "INTRUSION_ARMADA"),
    ("Disparos escuchados en el sector norte, posible enfrentamiento", "INTRUSION_ARMADA"),
    ("Efectivo herido durante patrullaje por grupo irregular armado", "INTRUSION_ARMADA"),
    ("Presencia de hombres armados con uniformes no identificados", "INTRUSION_ARMADA"),
    ("Emboscada a patrulla en el sector del Km 45, dos heridos", "INTRUSION_ARMADA"),
    ("Grupo de 20 hombres armados cruzando el río Venamo", "INTRUSION_ARMADA"),
    ("Se escucharon ráfagas de fusil a 500 metros del puesto de control", "INTRUSION_ARMADA"),
    ("Intrusión de grupo irregular con armamento pesado al área restringida", "INTRUSION_ARMADA"),
    ("Personal armado amenazó a comunidad indígena en el sector norte", "INTRUSION_ARMADA"),
    ("Vehículo blindado no identificado circulando en zona militar", "INTRUSION_ARMADA"),
    ("Enfrentamiento armado entre grupos irregulares cercano al puesto", "INTRUSION_ARMADA"),
    ("Detonaciones escuchadas en la madrugada, posible combate cercano", "INTRUSION_ARMADA"),
    ("Francotirador reportado en sector elevado cercano al campamento", "INTRUSION_ARMADA"),
    ("Grupo paramilitar detectado con armamento largo en la selva", "INTRUSION_ARMADA"),
    ("Interceptado individuo con armamento y uniformes no identificados", "INTRUSION_ARMADA"),
    ("Presencia de grupos armados irregulares al norte del río Carapo", "INTRUSION_ARMADA"),
    ("Explosión escuchada en sector 12, posible IED o combate", "INTRUSION_ARMADA"),
    ("Helicóptero no identificado sobrevolando zona restringida la noche", "INTRUSION_ARMADA"),
    ("Grupo armado exigiendo cuotas a mineros en zona de influencia", "INTRUSION_ARMADA"),
    ("Civiles reportan amenazas de muerte por grupo armado en el sector", "INTRUSION_ARMADA"),
    ("Patrulla recibió fuego de hostigamiento desde línea de vegetación", "INTRUSION_ARMADA"),
    ("Dos hombres armados con pistolas detenidos en puesto de control", "INTRUSION_ARMADA"),
    ("Banda armada de 10 personas con fusiles operando en la zona", "INTRUSION_ARMADA"),
    ("Alertan sobre presencia de guerrilla en comunidades del sur", "INTRUSION_ARMADA"),
    ("Movimiento de tropas no identificadas con armas cerca del límite", "INTRUSION_ARMADA"),
    ("Disparos al aire reportados por comunidad, posible intimidación", "INTRUSION_ARMADA"),
    ("Individuo con arma larga interceptado en punto de control este", "INTRUSION_ARMADA"),
    ("Grupos irregulares controlando acceso a zona minera con armas", "INTRUSION_ARMADA"),
    ("Ataque a puesto de control con armas de fuego, sin víctimas", "INTRUSION_ARMADA"),
    ("Infiltración detectada de grupo armado en perímetro del campamento", "INTRUSION_ARMADA"),

    # CONTRABANDO
    ("Vehículo detenido con carga de oro sin documentación", "CONTRABANDO"),
    ("Interceptada lancha con mercancías sin factura ni guía", "CONTRABANDO"),
    ("Contrabando de combustible hacia zona fronteriza detectado", "CONTRABANDO"),
    ("Camión con coltán sin permiso de exportación detenido en el puesto", "CONTRABANDO"),
    ("Contrabando de alimentos básicos en vehículo particular", "CONTRABANDO"),
    ("Interceptado cargamento ilegal de mercurio para uso minero", "CONTRABANDO"),
    ("Barco con mineral sin documentación detenido en control fluvial", "CONTRABANDO"),
    ("Se detuvo operación de extracción y venta ilegal de diamantes", "CONTRABANDO"),
    ("Cargamento de drogas y armas decomisado en puesto norte", "CONTRABANDO"),
    ("Tráfico de especies protegidas detectado en zona de reserva", "CONTRABANDO"),
    ("Persona interceptada con divisas y minerales sin declarar", "CONTRABANDO"),
    ("Contrabando de gasolina subsidiada hacia Brasil por camino verde", "CONTRABANDO"),
    ("Vehículo de doble fondo con mineral precioso decomisado", "CONTRABANDO"),
    ("Cargamento de oro sin certificado de origen interceptado", "CONTRABANDO"),
    ("Lancha rápida con mercancía sin manifesto fluvial detenida", "CONTRABANDO"),
    ("Tráfico ilícito de insumos mineros sin registro MIBAM", "CONTRABANDO"),
    ("Red de contrabando de mineral identificada en sector sur", "CONTRABANDO"),
    ("Camioneta con compartimento secreto y mineral precioso interceptada", "CONTRABANDO"),
    ("Sistema de trueque ilegal de oro por alimentos sin control", "CONTRABANDO"),
    ("Interceptado cargamento de madera ilegal de especie protegida", "CONTRABANDO"),
    ("Mercancías sin guia de movilizacion detenidas en alcabala", "CONTRABANDO"),
    ("Tráfico de fauna silvestre detectado en zona de reserva natural", "CONTRABANDO"),
    ("Venta ilegal de mineral fuera de circuitos autorizados PDVSA", "CONTRABANDO"),
    ("Extracción y comercialización no autorizada de coltan al norte", "CONTRABANDO"),
    ("Barco cargado con material extraído sin permiso rumbo a frontera", "CONTRABANDO"),
    ("Contrabando de medicamentos y equipos sin documentación oficial", "CONTRABANDO"),
    ("Material de extracción sin sellar trasladado en horas nocturnas", "CONTRABANDO"),
    ("Camión cisterna con gasolina subsidiada para exportación ilegal", "CONTRABANDO"),
    ("Individuo con maletín de mineral sin declarar detenido en aeropuerto", "CONTRABANDO"),
    ("Red de comercio ilegal de oro con intermediarios extranjeros", "CONTRABANDO"),

    # SIN_NOVEDAD
    ("Turno nocturno transcurrió con normalidad sin incidentes", "SIN_NOVEDAD"),
    ("Patrullaje de rutina completado sin novedades en el sector", "SIN_NOVEDAD"),
    ("Relevo efectuado correctamente, zona despejada y sin actividad", "SIN_NOVEDAD"),
    ("Sin novedades durante el turno, personal en posición normal", "SIN_NOVEDAD"),
    ("Reconocimiento aéreo completado, área tranquila y despejada", "SIN_NOVEDAD"),
    ("Puesto de control operando normalmente sin incidentes reportados", "SIN_NOVEDAD"),
    ("Patrulla fluvial realizada sin anomalías en el sector norte", "SIN_NOVEDAD"),
    ("Todo en orden en el sector, efectivos en sus puestos asignados", "SIN_NOVEDAD"),
    ("Inspección de rutina realizada, sin hallazgos relevantes", "SIN_NOVEDAD"),
    ("Movimiento vehicular normal en la vía, sin sospechosos", "SIN_NOVEDAD"),
    ("Guardia nocturna completada sin incidentes, relevo a tiempo", "SIN_NOVEDAD"),
    ("Sector calmo y despejado durante toda la jornada de patrullaje", "SIN_NOVEDAD"),
    ("Control fluvial realizado, embarcaciones con documentación en regla", "SIN_NOVEDAD"),
    ("Personal descansando en rotación, operaciones normales continuadas", "SIN_NOVEDAD"),
    ("Revisión del perímetro completada sin hallazgos de importancia", "SIN_NOVEDAD"),
    ("Comunicaciones con unidades satélite establecidas sin novedades", "SIN_NOVEDAD"),
    ("Reconocimiento terrestre completado, zona libre de actividad ilícita", "SIN_NOVEDAD"),
    ("Turno de guardia culminado exitosamente, relevado sin novedades", "SIN_NOVEDAD"),
    ("Actividad normal en el sector, tránsito fluvial controlado", "SIN_NOVEDAD"),
    ("Sin anomalías detectadas durante el recorrido de patrullaje", "SIN_NOVEDAD"),
]

# ─────────────────────────────────────────────────────────────────────────────
# ENTRENAMIENTO DEL MODELO
# ─────────────────────────────────────────────────────────────────────────────

def _limpiar_texto(texto: str) -> str:
    """Normaliza el texto para mejorar la vectorización."""
    texto = texto.lower()
    texto = re.sub(r'[^a-záéíóúüñ\s]', ' ', texto)
    return texto.strip()

texts, labels = zip(*TRAINING_DATA)
texts_clean = [_limpiar_texto(t) for t in texts]

pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1, 2),       # Unigramas + bigramas
        min_df=1,
        max_features=2000,
        sublinear_tf=True
    )),
    ('clf', MultinomialNB(alpha=0.3))
])

pipeline.fit(texts_clean, labels)
CLASES = pipeline.classes_

def clasificar(descripcion: str) -> dict:
    """
    Clasifica una descripción de reporte.
    Retorna: categoria, confianza (0-100)
    """
    texto_limpio = _limpiar_texto(descripcion)
    probas = pipeline.predict_proba([texto_limpio])[0]
    idx_max = int(np.argmax(probas))
    categoria = CLASES[idx_max]
    confianza = round(float(probas[idx_max]) * 100, 1)
    return {"categoria": categoria, "confianza": confianza}
