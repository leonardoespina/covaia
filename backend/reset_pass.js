require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const s = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  { host: 'db', dialect: 'postgres', logging: false }
);

async function resetPassword() {
  const hash = bcrypt.hashSync('Admin2026!', 10);
  await s.query(`UPDATE usuarios SET password_hash = '${hash}' WHERE cedula = '00000000'`);
  const [rows] = await s.query(`SELECT cedula, activo, rol FROM usuarios WHERE cedula = '00000000'`);
  console.log('✅ Contraseña actualizada correctamente');
  console.log('Usuario:', rows[0]);
  console.log('Hash generado:', hash);
  
  // Verificar inmediatamente
  const match = bcrypt.compareSync('Admin2026!', hash);
  console.log('Verificación bcrypt:', match ? '✅ CORRECTO' : '❌ FALLO');
  process.exit(0);
}

resetPassword().catch(e => { console.error(e); process.exit(1); });
