const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Despacho = sequelize.define('Despacho', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  alerta_id: { type: DataTypes.UUID, allowNull: false },
  unidad_despachada_id: { type: DataTypes.UUID, allowNull: false },
  despachado_por: { type: DataTypes.UUID, allowNull: false },
  tiempo_respuesta_min: { type: DataTypes.INTEGER },
  resultado: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'despachos',
  timestamps: false,
});

module.exports = Despacho;
