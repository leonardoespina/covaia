const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth.middleware');
const { getAlertas, patchAlertaEstado } = require('./alert.controller');

router.get('/', authMiddleware, getAlertas);
router.patch('/:id/estado', authMiddleware, patchAlertaEstado);

module.exports = router;
