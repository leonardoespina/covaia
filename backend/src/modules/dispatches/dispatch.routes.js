const express = require('express');
const router = express.Router();
const { createDespacho, getDespachos, resolverAlerta } = require('./dispatch.controller');
const { authMiddleware: verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');

router.use(verifyToken);

// Solo COMANDANTE y OFICIAL_OPERACIONES pueden despachar unidades
router.post('/', requireRole(['COMANDANTE', 'OFICIAL_OPERACIONES', 'ADMIN_SISTEMA']), createDespacho);

// Historial de despachos — todos los roles autenticados pueden verlo
router.get('/', getDespachos);

// Resolver alerta — solo COMANDANTE u OFICIAL
router.patch('/alertas/:id/resolver', requireRole(['COMANDANTE', 'OFICIAL_OPERACIONES', 'ADMIN_SISTEMA']), resolverAlerta);

module.exports = router;
