const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Alerta = sequelize.define('Alerta', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reporte_id: { type: DataTypes.UUID },
  nivel_riesgo: { type: DataTypes.STRING(20) }, // BAJO, MEDIO, ALTO, CRITICO
  categoria: { type: DataTypes.STRING(50) },
  resumen_ia: { type: DataTypes.TEXT },
  patron_detectado: { type: DataTypes.BOOLEAN, defaultValue: false },
  confianza: { type: DataTypes.FLOAT },
  estado: { type: DataTypes.STRING(20), defaultValue: 'ACTIVA' } // ACTIVA, ASIGNADA, RESUELTA
}, {
  tableName: 'alertas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Alerta;
