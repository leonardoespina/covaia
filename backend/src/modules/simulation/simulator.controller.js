const { sequelize } = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

const triggerSimulation = async (req, res) => {
  try {
    const { io } = require('../../app');
    
    // Simulate AI thinking delay for realism
    io.emit('ia_procesando', { descripcion: "Analizando feed de telemetría y cruzando datos satelitales VRSS-2 y UAVs..." });
    
    setTimeout(async () => {
      try {
        // 1. Alert 1: Thermal Drone - Suspicious Boat
        const alert1 = {
          id: uuidv4(),
          nivel_riesgo: 'CRITICO',
          categoria: 'INCURSION_RIO',
          resumen_ia: 'Firma térmica nocturna anómala (34°C) detectada a baja altitud. Probable lancha rápida con maquinaria no autorizada adentrándose en el área restringida.',
          patron_detectado: true,
          confianza: 98.7,
          estado: 'ACTIVA'
        };

        // 2. Alert 2: VRSS-2 Deforestation
        const alert2 = {
          id: uuidv4(),
          nivel_riesgo: 'ALTO',
          categoria: 'DEFORESTACION',
          resumen_ia: 'Análisis multiespectral avanzado del Satélite Sucre (VRSS-2) detecta remoción agresiva de capa vegetal (~3 HA) cerca de afluente hídrico, indicando probable minería ilegal reciente.',
          patron_detectado: true,
          confianza: 94.2,
          estado: 'ACTIVA'
        };

        const alertsToGenerate = [alert1, alert2];

        for (const a of alertsToGenerate) {
          const zonasAMO = [
            { nombre: 'Las Claritas (Bloque 4)', lat: 6.17, lng: -61.43 },
            { nombre: 'El Dorado (Bloque 4)', lat: 6.72, lng: -61.61 },
            { nombre: 'El Callao (Bloque 4)', lat: 7.34, lng: -61.82 },
            { nombre: 'Caicara del Orinoco (Bloque 1)', lat: 7.63, lng: -66.16 },
            { nombre: 'Tumeremo (Bloque 4)', lat: 7.29, lng: -61.50 }
          ];
          const zonaElegida = zonasAMO[Math.floor(Math.random() * zonasAMO.length)];

          const offsetLat = (Math.random() * 0.2) - 0.1;
          const offsetLng = (Math.random() * 0.2) - 0.1;

          const fakeReport = {
            id: uuidv4(),
            latitud: zonaElegida.lat + offsetLat,
            longitud: zonaElegida.lng + offsetLng,
            usuario: { nombre: `SENSOR-${zonaElegida.nombre.split(' ')[0].toUpperCase()}` }
          };

          // 1. Crear el Reporte Padre con coordenadas geográficas primero!
          await sequelize.query(
            `INSERT INTO reportes_patrulla (id, descripcion, tipo_evento, latitud, longitud, created_at)
             VALUES (:id, :descripcion, :tipo_evento, :latitud, :longitud, NOW())`,
            {
              replacements: {
                id: fakeReport.id,
                descripcion: 'Telemetría Táctica Interceptada Automáticamente',
                tipo_evento: a.categoria,
                latitud: fakeReport.latitud,
                longitud: fakeReport.longitud
              }
            }
          );

          // 2. Crear la Alerta amarrada al reporte
          await sequelize.query(
            `INSERT INTO alertas (id, nivel_riesgo, categoria, resumen_ia, patron_detectado, confianza, estado, reporte_id, created_at)
             VALUES (:id, :nivel_riesgo, :categoria, :resumen_ia, :patron_detectado, :confianza, :estado, :reporte_id, NOW())`,
            { replacements: { ...a, reporte_id: fakeReport.id } }
          );

          io.emit('nueva_alerta', {
            ...a,
            created_at: new Date().toISOString(),
            reporte: fakeReport
          });
        }
      } catch(err) {
        console.error("Error intertando simulacion", err);
      }
    }, 4500);

    res.json({ message: 'Simulación lanzada y procesando' });
  } catch (error) {
    console.error('Error in simulation trigger:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

module.exports = { triggerSimulation };
