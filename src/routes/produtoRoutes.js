const express = require('express');
const router = express.Router();
const ProdutoController = require('../controllers/ProdutoController');
const exigirAutenticacao = require('../middlewares/exigirAutenticacao');

// A ORDEM DESTAS ROTAS IMPORTA.
//
// '/produtos/buscar' e '/produtos/categorias' vêm antes de '/produtos/:id'. O Express
// casa a primeira rota compatível, portanto, na ordem inversa, ele trataria as palavras
// "buscar" e "categorias" como se fossem um id e o pedido cairia no lugar errado.

// ---- Leitura. Pública, porque a vitrine é pública. ----

// Pesquisa por nome, categoria ou numeração.
router.get('/produtos/buscar', ProdutoController.buscarProdutos);

// Opções de filtro, lidas do banco.
router.get('/produtos/categorias', ProdutoController.listarOpcoesDeFiltro);

// Lista com filtro, ordenação e paginação.
router.get('/produtos', ProdutoController.listarProdutos);

// Um produto pelo id. Precisa vir depois das duas rotas de palavra fixa acima.
router.get('/produtos/:id', ProdutoController.mostrarProduto);

// ---- Escrita. Exige sessão do dono da loja. ----

router.post('/produtos', exigirAutenticacao, ProdutoController.adicionarProduto);
router.put('/produtos/:id', exigirAutenticacao, ProdutoController.atualizarProduto);
router.delete('/produtos/:id', exigirAutenticacao, ProdutoController.removerProduto);

// ---- Estoque por unidade e histórico. Exige sessão. ----
//
// Estas rotas têm um segmento a mais que '/produtos/:id', portanto o Express não as
// confunde com um id e a posição delas no arquivo não muda o resultado.
//
// A leitura também pede sessão, ao contrário do resto. O saldo de cada loja e o
// histórico de entrada e saída descrevem a operação, e não o catálogo. O cliente da
// vitrine vê apenas o total, que já vem no campo quantidade do produto.
router.get('/produtos/:id/estoque', exigirAutenticacao, ProdutoController.mostrarEstoque);
router.get(
    '/produtos/:id/movimentacoes',
    exigirAutenticacao,
    ProdutoController.listarMovimentacoes
);
router.post(
    '/produtos/:id/movimentacoes',
    exigirAutenticacao,
    ProdutoController.registrarMovimentacao
);

module.exports = router;
