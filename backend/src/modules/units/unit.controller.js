const Unidad = require('./unit.model');

// --- LISTAR UNIDADES ---
const getUnidades = async (req, res) => {
  try {
    const unidades = await Unidad.findAll({
      where: { activa: true },
      order: [['nombre', 'ASC']],
    });
    res.json(unidades);
  } catch (error) {
    console.error('Error al listar unidades:', error);
    res.status(500).json({ message: 'Error al obtener unidades' });
  }
};

// --- DETALLE DE UNIDAD ---
const getUnidadById = async (req, res) => {
  try {
    const unidad = await Unidad.findByPk(req.params.id);
    if (!unidad) return res.status(404).json({ message: 'Unidad no encontrada' });
    res.json(unidad);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener unidad' });
  }
};

module.exports = { getUnidades, getUnidadById };
