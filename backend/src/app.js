require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Carpeta de uploads
const uploadsDir = '/app/uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Rutas APIS
const authRoutes = require('./modules/auth/auth.routes');
const reportRoutes = require('./modules/reports/report.routes');
const alertRoutes = require('./modules/alerts/alert.routes');
const dispatchRoutes = require('./modules/dispatches/dispatch.routes');
const unitRoutes = require('./modules/units/unit.routes');
const simulatorRoutes = require('./modules/simulation/simulator.routes');
const chatRoutes = require('./modules/chat/chat.routes');

app.use('/api/auth', authRoutes);
app.use('/api/reportes', reportRoutes);
app.use('/api/alertas', alertRoutes);
app.use('/api/despachos', dispatchRoutes);
app.use('/api/unidades', unitRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/chat', chatRoutes);

// Asociaciones centralizadas (evita duplicados de Sequelize)
const User = require('./modules/auth/user.model');
const Reporte = require('./modules/reports/report.model');
const Alerta = require('./modules/alerts/alert.model');
const Despacho = require('./modules/dispatches/dispatch.model');
const Unidad = require('./modules/units/unit.model');

Reporte.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });
Alerta.belongsTo(Reporte, { foreignKey: 'reporte_id', as: 'reporte' });
Despacho.belongsTo(Alerta, { foreignKey: 'alerta_id', as: 'alerta' });
Despacho.belongsTo(Unidad, { foreignKey: 'unidad_despachada_id', as: 'unidad' });
Despacho.belongsTo(User, { foreignKey: 'despachado_por', as: 'despachador' });
Alerta.hasMany(Despacho, { foreignKey: 'alerta_id', as: 'despachos' });

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'COVA-AI Backend', timestamp: new Date() });
});

// WebSocket
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
  });
});

// Exportar io para que report.controller pueda emitir alertas en tiempo real
module.exports = { io };

// Arranque
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Backend COVA-AI corriendo en http://localhost:${PORT}`);
  });
});
