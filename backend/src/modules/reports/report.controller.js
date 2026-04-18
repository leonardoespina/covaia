const Reporte = require('./report.model');
const User = require('../auth/user.model');
const axios = require('axios');

// --- CREAR REPORTE ---
const createReporte = async (req, res) => {
  try {
    const { descripcion, tipo_evento, latitud, longitud, unidad_id } = req.body;
    const foto_url = req.file ? `/uploads/${req.file.filename}` : null;

    const reporte = await Reporte.create({
      descripcion,
      tipo_evento,
      latitud: latitud ? parseFloat(latitud) : null,
      longitud: longitud ? parseFloat(longitud) : null,
      unidad_id: unidad_id || null,
      usuario_id: req.user.id,
      foto_url,
      sincronizado: true
    });

    // Llamar al Motor de IA en segundo plano (sin bloquear la respuesta)
    triggerAIAnalysis(reporte).catch(err => {
      console.error('⚠️ Error al llamar al Motor IA:', err.message);
    });

    res.status(201).json({ message: 'Reporte creado exitosamente', reporte });
  } catch (error) {
    console.error('Error al crear reporte:', error);
    res.status(500).json({ message: 'Error interno al crear reporte' });
  }
};

// --- LISTAR REPORTES ---
const getReportes = async (req, res) => {
  try {
    const { tipo_evento, limit = 50 } = req.query;
    const where = {};
    if (tipo_evento) where.tipo_evento = tipo_evento;

    const reportes = await Reporte.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['nombre', 'rango', 'rol']
      }]
    });

    res.json(reportes);
  } catch (error) {
    console.error('Error al listar reportes:', error);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
};

// --- DETALLE DE REPORTE ---
const getReporteById = async (req, res) => {
  try {
    const reporte = await Reporte.findByPk(req.params.id, {
      include: [{ model: User, as: 'usuario', attributes: ['nombre', 'rango', 'rol'] }]
    });
    if (!reporte) return res.status(404).json({ message: 'Reporte no encontrado' });
    res.json(reporte);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reporte' });
  }
};

const triggerAIAnalysis = async (reporte) => {
  // Notificar al frontend que la IA está pensando
  try {
    const { io } = require('../../app');
    io.emit('ia_procesando', { reporte_id: reporte.id, descripcion: reporte.descripcion });
  } catch (e) {
    console.warn('WebSocket no disponible:', e.message);
  }

  const aiUrl = process.env.AI_ENGINE_URL || 'http://ai-engine:8000';
  const response = await axios.post(`${aiUrl}/analyze`, {
    descripcion: reporte.descripcion,
    tipo_evento: reporte.tipo_evento,
    unidad_id: reporte.unidad_id,
    latitud: reporte.latitud,
    longitud: reporte.longitud
  });

  const { categoria, nivel_riesgo, confianza, patron_detectado, resumen_ia } = response.data;

  // Crear alerta en la BD
  const { sequelize } = require('../../config/db');
  const [rows] = await sequelize.query(
    `INSERT INTO alertas (id, reporte_id, nivel_riesgo, categoria, resumen_ia, patron_detectado, confianza)
     VALUES (uuid_generate_v4(), :reporte_id, :nivel_riesgo, :categoria, :resumen_ia, :patron_detectado, :confianza)
     RETURNING *`,
    {
      replacements: { reporte_id: reporte.id, nivel_riesgo, categoria, resumen_ia, patron_detectado, confianza }
    }
  );

  const nuevaAlerta = rows[0];
  console.log(`🤖 Alerta IA generada: [${nivel_riesgo}] ${categoria}`);

  // Emitir WebSocket para tiempo real en el mapa
  try {
    const { io } = require('../../app');
    io.emit('nueva_alerta', {
      ...nuevaAlerta,
      reporte: {
        descripcion: reporte.descripcion,
        tipo_evento: reporte.tipo_evento,
        latitud: reporte.latitud,
        longitud: reporte.longitud
      }
    });
  } catch (e) {
    console.warn('WebSocket no disponible:', e.message);
  }
};

module.exports = { createReporte, getReportes, getReporteById };
