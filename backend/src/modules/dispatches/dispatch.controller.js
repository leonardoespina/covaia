const Despacho = require('./dispatch.model');
const Alerta = require('../alerts/alert.model');
const Unidad = require('../units/unit.model');
const User = require('../auth/user.model');

// --- CREAR DESPACHO ---
const createDespacho = async (req, res) => {
  try {
    const { alerta_id, unidad_despachada_id, tiempo_respuesta_min, resultado } = req.body;

    if (!alerta_id || !unidad_despachada_id) {
      return res.status(400).json({ message: 'Se requieren alerta_id y unidad_despachada_id' });
    }

    // Verificar que la alerta exista y esté activa
    const alerta = await Alerta.findByPk(alerta_id);
    if (!alerta) return res.status(404).json({ message: 'Alerta no encontrada' });
    if (alerta.estado === 'RESUELTA') {
      return res.status(400).json({ message: 'Esta alerta ya fue resuelta' });
    }

    // Verificar que la unidad exista
    const unidad = await Unidad.findByPk(unidad_despachada_id);
    if (!unidad) return res.status(404).json({ message: 'Unidad no encontrada' });

    // Crear el despacho
    const despacho = await Despacho.create({
      alerta_id,
      unidad_despachada_id,
      despachado_por: req.user.id,
      tiempo_respuesta_min: tiempo_respuesta_min || null,
      resultado: resultado || null,
    });

    // Marcar la alerta como ASIGNADA automáticamente
    alerta.estado = 'ASIGNADA';
    await alerta.save();

    // Recuperar despacho con relaciones para el WebSocket y la respuesta
    const despachoCompleto = await Despacho.findByPk(despacho.id, {
      include: [
        { model: Alerta, as: 'alerta', attributes: ['nivel_riesgo', 'categoria', 'resumen_ia'] },
        { model: Unidad, as: 'unidad', attributes: ['nombre', 'tipo'] },
        { model: User, as: 'despachador', attributes: ['nombre', 'rango'] },
      ],
    });

    // Notificar via WebSocket
    try {
      const { io } = require('../../app');
      io.emit('despacho_creado', despachoCompleto);
      io.emit('alerta_actualizada', { id: alerta_id, estado: 'ASIGNADA', unidad: unidad.nombre });
    } catch (e) {
      console.warn('⚠️ WebSocket no disponible para despacho:', e.message);
    }

    console.log(`🚁 Despacho creado: Unidad "${unidad.nombre}" → Alerta [${alerta.nivel_riesgo}]`);
    res.status(201).json({ message: 'Unidad despachada exitosamente', despacho: despachoCompleto });
  } catch (error) {
    console.error('Error al crear despacho:', error);
    res.status(500).json({ message: 'Error interno al crear despacho' });
  }
};

// --- LISTAR DESPACHOS ---
const getDespachos = async (req, res) => {
  try {
    const { alerta_id, limit = 50 } = req.query;
    const where = {};
    if (alerta_id) where.alerta_id = alerta_id;

    const despachos = await Despacho.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      include: [
        {
          model: Alerta,
          as: 'alerta',
          attributes: ['nivel_riesgo', 'categoria', 'resumen_ia', 'estado'],
        },
        {
          model: Unidad,
          as: 'unidad',
          attributes: ['nombre', 'tipo'],
        },
        {
          model: User,
          as: 'despachador',
          attributes: ['nombre', 'rango', 'rol'],
        },
      ],
    });

    res.json(despachos);
  } catch (error) {
    console.error('Error al listar despachos:', error);
    res.status(500).json({ message: 'Error al obtener despachos' });
  }
};

// --- RESOLVER ALERTA (Cerrar el ciclo) ---
const resolverAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const { resultado } = req.body;

    const alerta = await Alerta.findByPk(id);
    if (!alerta) return res.status(404).json({ message: 'Alerta no encontrada' });

    alerta.estado = 'RESUELTA';
    await alerta.save();

    // Actualizar el resultado en el despacho asociado si existe
    if (resultado) {
      const despacho = await Despacho.findOne({ where: { alerta_id: id }, order: [['created_at', 'DESC']] });
      if (despacho) {
        despacho.resultado = resultado;
        await despacho.save();
      }
    }

    // Notificar WebSocket
    try {
      const { io } = require('../../app');
      io.emit('alerta_actualizada', { id, estado: 'RESUELTA' });
    } catch (e) { /* ignore */ }

    res.json({ message: 'Alerta resuelta correctamente', alerta });
  } catch (error) {
    res.status(500).json({ message: 'Error al resolver alerta' });
  }
};

module.exports = { createDespacho, getDespachos, resolverAlerta };
