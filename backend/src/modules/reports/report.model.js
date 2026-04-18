const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Reporte = sequelize.define('Reporte', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  unidad_id: { type: DataTypes.UUID },
  usuario_id: { type: DataTypes.UUID },
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  tipo_evento: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  latitud: { type: DataTypes.FLOAT },
  longitud: { type: DataTypes.FLOAT },
  foto_url: { type: DataTypes.STRING },
  sincronizado: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'reportes_patrulla',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Reporte;
