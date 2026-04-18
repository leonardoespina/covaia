const Alerta = require('./alert.model');
const Reporte = require('../reports/report.model');
const User = require('../auth/user.model');


// --- LISTAR ALERTAS ---
const getAlertas = async (req, res) => {
  try {
    const { estado, limit = 50 } = req.query;
    const where = {};
    if (estado) where.estado = estado;

    const alertas = await Alerta.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      include: [{
        model: Reporte,
        as: 'reporte',
        attributes: ['descripcion', 'tipo_evento', 'latitud', 'longitud', 'foto_url'],
        include: [{ model: User, as: 'usuario', attributes: ['nombre', 'rango'] }]
      }]
    });

    res.json(alertas);
  } catch (error) {
    console.error('Error al listar alertas:', error);
    res.status(500).json({ message: 'Error al obtener alertas' });
  }
};

// --- CAMBIAR ESTADO DE UNA ALERTA ---
const patchAlertaEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const allowed = ['ACTIVA', 'ASIGNADA', 'RESUELTA'];
    if (!allowed.includes(estado)) {
      return res.status(400).json({ message: `Estado inválido. Use: ${allowed.join(', ')}` });
    }

    const alerta = await Alerta.findByPk(id);
    if (!alerta) return res.status(404).json({ message: 'Alerta no encontrada' });

    alerta.estado = estado;
    await alerta.save();
    res.json({ message: 'Estado actualizado', alerta });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar alerta' });
  }
};

module.exports = { getAlertas, patchAlertaEstado };
