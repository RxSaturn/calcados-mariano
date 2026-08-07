const express = require('express');
const router = express.Router();
const HealthController = require('../controllers/HealthController');

// Rota de monitoramento. Responde 200 quando o banco responde e 503 quando não responde.
router.get('/health', HealthController.verificarSaude);

module.exports = router;
