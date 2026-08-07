const express = require('express');
const router = express.Router();
const ProdutoController = require('../controllers/ProdutoController');

// Rota 1: Mostrar todos os produtos
router.get('/produtos', ProdutoController.listarProdutos);

// Rota 2: Pesquisar produtos (Atenção: essa rota precisa vir ANTES da rota de adicionar para não dar conflito)
router.get('/produtos/buscar', ProdutoController.buscarProdutos);

// Rota 3: Adicionar um produto (Usa POST, pois estamos ENVIANDO dados para salvar)
router.post('/produtos', ProdutoController.adicionarProduto);

module.exports = router;
