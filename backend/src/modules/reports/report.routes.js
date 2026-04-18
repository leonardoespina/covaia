const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../../middleware/auth.middleware');
const { createReporte, getReportes, getReporteById } = require('./report.controller');

// Configuración de multer para subida de fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '/app/uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) return cb(null, true);
    cb(new Error('Solo se permiten imágenes (jpg, png, webp)'));
  }
});

// Rutas protegidas por JWT
router.post('/', authMiddleware, upload.single('foto'), createReporte);
router.get('/', authMiddleware, getReportes);
router.get('/:id', authMiddleware, getReporteById);

module.exports = router;
