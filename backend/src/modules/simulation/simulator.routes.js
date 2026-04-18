const express = require('express');
const router = express.Router();
const { triggerSimulation } = require('./simulator.controller');

router.post('/trigger', triggerSimulation);

module.exports = router;
