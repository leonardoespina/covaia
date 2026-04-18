const express = require('express');
const router = express.Router();
const { getUnidades, getUnidadById } = require('./unit.controller');
const { authMiddleware: verifyToken } = require('../../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', getUnidades);
router.get('/:id', getUnidadById);

module.exports = router;
