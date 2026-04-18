const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Unidad = sequelize.define('Unidad', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  tipo: { type: DataTypes.STRING(30) }, // PUESTO_CONTROL, PATRULLA_MOVIL
  efectivos_asignados: { type: DataTypes.INTEGER, defaultValue: 0 },
  activa: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'unidades',
  timestamps: false,
});

module.exports = Unidad;
