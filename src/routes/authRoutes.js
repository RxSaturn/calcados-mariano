const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// Sessão do dono da loja. O painel usa estas três rotas.
router.post('/auth/login', AuthController.entrar);
router.post('/auth/logout', AuthController.sair);
router.get('/auth/sessao', AuthController.sessao);

module.exports = router;
