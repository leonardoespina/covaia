require('dotenv').config({ path: './.env' });
const { sequelize } = require('./src/config/db');
const Reporte = require('./src/modules/reports/report.model');
const Alerta = require('./src/modules/alerts/alert.model');
const Despacho = require('./src/modules/dispatches/dispatch.model');

async function resetDB() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión establecida.');

    console.log('Borrando Despachos...');
    await Despacho.destroy({ where: {}, truncate: true, cascade: true });
    
    console.log('Borrando Alertas...');
    await Alerta.destroy({ where: {}, truncate: true, cascade: true });
    
    console.log('Borrando Reportes...');
    await Reporte.destroy({ where: {}, truncate: true, cascade: true });

    console.log('✅ Base de datos reiniciada con éxito (Usuarios y Unidades mantenidos).');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al reiniciar base de datos:', error);
    process.exit(1);
  }
}

resetDB();
