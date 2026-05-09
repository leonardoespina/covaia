const { sequelize } = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

// ── HELPERS DE VARIACIÓN DINÁMICA ────────────────────────────────────────────
const rnd   = (min, max, dec = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(dec));
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];

const rios    = ['Caroní', 'Cuyuní', 'Yuruari', 'Aro', 'Paragua', 'Botanamo'];
const bloques = ['Bloque 1', 'Bloque 2', 'Bloque 3', 'Bloque 4'];
const equipos = ['retroexcavadora', 'draga de succión', 'buldózer', 'cargadora frontal', 'motobomba industrial'];

// ── GENERADORES DE RESUMEN DINÁMICO POR CATEGORÍA ───────────────────────────
const generarResumen = {
  INCURSION_RIO: () => {
    const temp = rnd(31, 42); const vel = rnd(18, 55); const rio = pick(rios);
    return `Firma térmica anómala (${temp}°C) detectada sobre el río ${rio}. Embarcación a ${vel} km/h con patrón evasivo hacia zona restringida. Sensor UAV confirma maquinaria a bordo. ${pick(bloques)} comprometido.`;
  },
  DEFORESTACION: () => {
    const ha = rnd(1.8, 9.2); const ndvi = rnd(-0.12, 0.15); const rio = pick(rios);
    return `VRSS-2 multiespectral detecta remoción de capa vegetal (~${ha} HA) próximo al afluente ${rio}. NDVI colapsado a ${ndvi} (umbral crítico: 0.20). ${ha > 5 ? 'Escala industrial confirmada.' : 'Probable operación artesanal expandida.'}`;
  },
  DEFORESTACION_PICA: () => {
    const km = rnd(2.1, 8.9); const ancho = rnd(4, 18, 0);
    return `UAV-RECONOCIMIENTO detecta apertura de pica no autorizada de ${km} km de longitud y ~${ancho} m de ancho. Tala sistemática a ambos lados del trazado. Compatible con vía de acceso para maquinaria pesada.`;
  },
  DESVIO_CAUCE: () => {
    const rio = pick(rios); const metros = rnd(40, 380, 0);
    return `VRSS-2 infrarrojo confirma desvío de cauce en río ${rio}. Canal artificial de ${metros} m detectado mediante comparación temporal. Probable dragado ilegal aguas arriba del punto de captación.`;
  },
  MAQUINARIA_PESADA: () => {
    const cant = Math.floor(rnd(1, 6, 0)); const equipo = pick(equipos); const hp = rnd(120, 320, 0);
    return `Sensor térmico UAV registra ${cant} unidad(es) de ${equipo} en operación (≥${hp} HP). Zona exclusiva de minería artesanal comprometida. Acceso no autorizado confirmado por imagen satelital.`;
  },
  COLUMNAS_HUMO: () => {
    const km = rnd(0.8, 4.5); const temp = rnd(280, 620, 0);
    return `VRSS-2 multiespectral detecta pluma de humo de ${km} km de extensión. Temperatura del foco: ${temp}°C. Análisis espectral indica combustión mixta (vegetal + plástico). Sin permisos de quema registrados para esta cuadrícula.`;
  },
  SEDIMENTACION: () => {
    const ntu = rnd(180, 920, 0); const km = rnd(0.6, 3.8);
    return `VRSS-2 óptico confirma descarga de efluentes en cuerpo de agua protegido. Turbidez: ${ntu} NTU (legal máx: 20 NTU). Pluma visible ${km} km aguas abajo. Daño ambiental en progreso — intervención urgente.`;
  },
  ACTIVIDAD_FUERA_LIMITE: () => {
    const dist = rnd(0.3, 4.8); const bloque = pick(bloques);
    return `Cruce GPS vs. shapefile de concesiones: actividad extractiva a ${dist} km fuera del perímetro autorizado en ${bloque}. Equipamiento activo sin título minero. Violación directa Art. 15 Ley de Minas.`;
  },
};

// ── CONFIANZA DINÁMICA POR CATEGORÍA ─────────────────────────────────────────
const confianzaBase = {
  INCURSION_RIO:         [92, 99.5],
  DEFORESTACION:         [88, 97],
  DEFORESTACION_PICA:    [85, 95],
  DESVIO_CAUCE:          [90, 98],
  MAQUINARIA_PESADA:     [82, 95],
  COLUMNAS_HUMO:         [78, 93],
  SEDIMENTACION:         [86, 97],
  ACTIVIDAD_FUERA_LIMITE:[94, 99.9],
};

const triggerSimulation = async (req, res) => {
  try {
    const { io } = require('../../app');

    io.emit('ia_procesando', { descripcion: "Analizando feed de telemetría y cruzando datos satelitales VRSS-2 y UAVs..." });

    setTimeout(async () => {
      try {
        // ── TODOS LOS EVENTOS — aparecen SIEMPRE, con datos dinámicos ─────────────
        const eventDefinitions = [
          { nivel_riesgo: 'CRITICO', categoria: 'INCURSION_RIO',         patron_detectado: true  },
          { nivel_riesgo: 'ALTO',    categoria: 'DEFORESTACION',          patron_detectado: true  },
          { nivel_riesgo: 'ALTO',    categoria: 'DEFORESTACION_PICA',     patron_detectado: false },
          { nivel_riesgo: 'CRITICO', categoria: 'DESVIO_CAUCE',           patron_detectado: true  },
          { nivel_riesgo: 'ALTO',    categoria: 'MAQUINARIA_PESADA',      patron_detectado: false },
          { nivel_riesgo: 'MEDIO',   categoria: 'COLUMNAS_HUMO',          patron_detectado: false },
          { nivel_riesgo: 'ALTO',    categoria: 'SEDIMENTACION',           patron_detectado: true  },
          { nivel_riesgo: 'CRITICO', categoria: 'ACTIVIDAD_FUERA_LIMITE', patron_detectado: true  },
        ];

        // ── ZONAS DEL ARCO MINERO (cada evento cae en zona diferente) ─────────────
        const zonasAMO = [
          { nombre: 'Las Claritas (Bloque 4)',       lat: 6.17,  lng: -61.43 },
          { nombre: 'El Dorado (Bloque 4)',           lat: 6.72,  lng: -61.61 },
          { nombre: 'El Callao (Bloque 4)',           lat: 7.34,  lng: -61.82 },
          { nombre: 'Caicara del Orinoco (Bloque 1)', lat: 7.63,  lng: -66.16 },
          { nombre: 'Tumeremo (Bloque 4)',            lat: 7.29,  lng: -61.50 },
          { nombre: 'Km 88 (Las Cristinas)',          lat: 6.00,  lng: -61.10 },
          { nombre: 'Maripa (Bloque 2)',              lat: 7.40,  lng: -65.17 },
          { nombre: 'Upata (Bloque 3)',               lat: 8.01,  lng: -62.39 },
        ];

        // ── CONSOLA VRSS-2 ─────────────────────────────────────────────────────────
        const consoleTag = {
          INCURSION_RIO:         '🚨 FIRMA TERMICA — CAUCE FLUVIAL COMPROMETIDO',
          DEFORESTACION:         '⚠ NDVI CRITICO — REMOCION CAPA VEGETAL',
          DEFORESTACION_PICA:    '⚠ APERTURA DE PICA — TALA NO AUTORIZADA',
          DESVIO_CAUCE:          '🚨 DESVIO DE CAUCE — ALTERACION HIDRAULICA',
          MAQUINARIA_PESADA:     '⚠ FIRMA DIESEL — MAQUINARIA PESADA DETECTADA',
          COLUMNAS_HUMO:         '⚠ PLUMA DE HUMO — QUEMA SIN PERMISO',
          SEDIMENTACION:         '⚠ TURBIDEZ CRITICA — EFLUENTES ACTIVOS',
          ACTIVIDAD_FUERA_LIMITE:'🚨 VIOLACION LIMITE — FUERA DE CONCESION',
        };

        // Usar una zona diferente para cada evento (rotar la lista aleatoriamente)
        const zonasShuffled = [...zonasAMO].sort(() => Math.random() - 0.5);

        for (let i = 0; i < eventDefinitions.length; i++) {
          const def  = eventDefinitions[i];
          const zona = zonasShuffled[i % zonasShuffled.length];

          // Offset pequeño para que no se apilen en el mismo punto exacto
          const offsetLat = rnd(-0.18, 0.18);
          const offsetLng = rnd(-0.18, 0.18);
          const alertLat  = parseFloat((zona.lat + offsetLat).toFixed(5));
          const alertLng  = parseFloat((zona.lng + offsetLng).toFixed(5));

          // Texto y confianza DINÁMICOS — distintos en cada escaneo
          const [cMin, cMax] = confianzaBase[def.categoria];
          const confianza    = rnd(cMin, cMax);
          const resumen_ia   = generarResumen[def.categoria]();

          const reporteId = uuidv4();
          const alertId   = uuidv4();

          const fakeReport = {
            id:       reporteId,
            latitud:  alertLat,
            longitud: alertLng,
            usuario:  { nombre: `SENSOR-${zona.nombre.split(' ')[0].toUpperCase()}` }
          };

          // 1. Crear reporte padre
          await sequelize.query(
            `INSERT INTO reportes_patrulla (id, descripcion, tipo_evento, latitud, longitud, created_at)
             VALUES (:id, :descripcion, :tipo_evento, :latitud, :longitud, NOW())`,
            {
              replacements: {
                id:          reporteId,
                descripcion: `[VRSS-2/UAV] ${consoleTag[def.categoria]} — ${zona.nombre}`,
                tipo_evento: def.categoria,
                latitud:     alertLat,
                longitud:    alertLng
              }
            }
          );

          // 2. Crear alerta vinculada
          await sequelize.query(
            `INSERT INTO alertas (id, nivel_riesgo, categoria, resumen_ia, patron_detectado, confianza, estado, reporte_id, created_at)
             VALUES (:id, :nivel_riesgo, :categoria, :resumen_ia, :patron_detectado, :confianza, :estado, :reporte_id, NOW())`,
            {
              replacements: {
                id:               alertId,
                nivel_riesgo:     def.nivel_riesgo,
                categoria:        def.categoria,
                resumen_ia:       resumen_ia,
                patron_detectado: def.patron_detectado,
                confianza:        confianza,
                estado:           'ACTIVA',
                reporte_id:       reporteId
              }
            }
          );

          // 3. Emitir en tiempo real por WebSocket
          io.emit('nueva_alerta', {
            id:               alertId,
            nivel_riesgo:     def.nivel_riesgo,
            categoria:        def.categoria,
            resumen_ia:       resumen_ia,
            patron_detectado: def.patron_detectado,
            confianza:        confianza,
            estado:           'ACTIVA',
            created_at:       new Date().toISOString(),
            reporte:          fakeReport
          });
        }

      } catch(err) {
        console.error("Error ejecutando simulacion VRSS-2:", err);
      }
    }, 4500);

    res.json({ message: 'Simulación VRSS-2 lanzada — 8 eventos en procesamiento' });
  } catch (error) {
    console.error('Error in simulation trigger:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

module.exports = { triggerSimulation };
