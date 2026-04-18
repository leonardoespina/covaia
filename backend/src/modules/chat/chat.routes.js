const express = require('express');
const router = express.Router();
const { askAI } = require('./chat.controller');

router.post('/', askAI);

module.exports = router;
