const ProdutoModel = require('../models/ProdutoModel');
const EstoqueModel = require('../models/EstoqueModel');
const MovimentacaoModel = require('../models/MovimentacaoModel');

// Traduz o erro do model para a resposta HTTP.
//
// O model marca falha de validação com 'validacao' e recurso ausente com 'naoEncontrado'.
// Qualquer outro erro é falha do banco, e vira 500 com mensagem genérica, para não vazar
// detalhe interno ao cliente.
const responderErro = (res, erro, mensagemDe500) => {
    if (erro.validacao) {
        return res.status(400).json({ mensagem: erro.message, erros: erro.erros });
    }
    if (erro.naoEncontrado) {
        return res.status(404).json({ mensagem: erro.message });
    }
    return res.status(500).json({ mensagem: mensagemDe500 });
};

const ProdutoController = {
    // GET /produtos com filtro, ordenação e paginação.
    // A resposta é um envelope, e não um array cru, porque a tela precisa do total para
    // montar a paginação.
    listarProdutos: (req, res) => {
        const filtros = {
            publico: req.query.publico,
            categoria: req.query.categoria,
            ordenar: req.query.ordenar,
            pagina: req.query.pagina,
            limite: req.query.limite
        };

        ProdutoModel.listar(filtros, (erro, resultado) => {
            if (erro) return responderErro(res, erro, 'Erro interno ao buscar os produtos.');
            return res.status(200).json(resultado);
        });
    },

    // GET /produtos/categorias
    // A vitrine monta o menu de filtro com isto, em vez de repetir uma lista fixa no
    // código que sai de sincronia com os dados.
    listarOpcoesDeFiltro: (req, res) => {
        ProdutoModel.opcoesDeFiltro((erro, opcoes) => {
            if (erro) return responderErro(res, erro, 'Erro interno ao buscar as opções.');
            return res.status(200).json(opcoes);
        });
    },

    // GET /produtos/:id
    mostrarProduto: (req, res) => {
        ProdutoModel.porId(req.params.id, (erro, produto) => {
            if (erro) return responderErro(res, erro, 'Erro interno ao buscar o produto.');
            return res.status(200).json(produto);
        });
    },

    // POST /produtos
    adicionarProduto: (req, res) => {
        ProdutoModel.adicionar(req.body, (erro, criado) => {
            if (erro) return responderErro(res, erro, 'Erro ao salvar o produto no banco.');
            return res
                .status(201)
                .json({ mensagem: 'Produto adicionado com sucesso!', id: criado.id });
        });
    },

    // PUT /produtos/:id. Substitui os atributos do produto.
    //
    // A quantidade não passa por aqui. Um corpo que traga "quantidade" recebe 400, com
    // a rota certa na mensagem, em vez de um 200 que não mudaria o saldo.
    atualizarProduto: (req, res) => {
        ProdutoModel.atualizar(req.params.id, req.body, (erro, alterado) => {
            if (erro) return responderErro(res, erro, 'Erro ao atualizar o produto.');
            return res.status(200).json({ mensagem: 'Produto atualizado.', id: alterado.id });
        });
    },

    // DELETE /produtos/:id
    removerProduto: (req, res) => {
        ProdutoModel.remover(req.params.id, (erro, removido) => {
            if (erro) return responderErro(res, erro, 'Erro ao remover o produto.');
            return res.status(200).json({ mensagem: 'Produto removido.', id: removido.id });
        });
    },

    // GET /produtos/buscar
    buscarProdutos: (req, res) => {
        // req.query pega os parâmetros da URL. Ex: ?tipo=numeracao&termo=41
        ProdutoModel.buscar(req.query.termo, req.query.tipo, (erro, resultados) => {
            // Antes desta checagem, um pedido sem 'tipo' derrubava o servidor.
            if (erro) return responderErro(res, erro, 'Erro ao pesquisar os produtos.');
            return res.status(200).json(resultados);
        });
    },

    // GET /produtos/:id/estoque. Saldo de cada unidade e o total.
    // Fica atrás de sessão: onde cada par está é dado de operação da loja, e a vitrine
    // mostra ao cliente apenas o total, que já vem em produtos.quantidade.
    mostrarEstoque: (req, res) => {
        if (!/^[1-9][0-9]*$/.test(String(req.params.id))) {
            return res.status(400).json({ mensagem: 'O id precisa ser um número inteiro.' });
        }

        EstoqueModel.porProduto(req.params.id)
            .then((saldo) => res.status(200).json(saldo))
            .catch((erro) => responderErro(res, erro, 'Erro ao buscar o estoque do produto.'));
    },

    // POST /produtos/:id/movimentacoes. A única porta por onde o saldo muda.
    registrarMovimentacao: (req, res) => {
        MovimentacaoModel.registrar(req.params.id, req.body, (erro, movimentacao) => {
            if (erro) return responderErro(res, erro, 'Erro ao registrar a movimentação.');
            return res.status(201).json({
                mensagem: 'Movimentação registrada.',
                ...movimentacao
            });
        });
    },

    // GET /produtos/:id/movimentacoes. Histórico, do mais recente para o mais antigo.
    listarMovimentacoes: (req, res) => {
        const filtros = { pagina: req.query.pagina, limite: req.query.limite };

        MovimentacaoModel.listar(req.params.id, filtros, (erro, resultado) => {
            if (erro) return responderErro(res, erro, 'Erro ao buscar o histórico.');
            return res.status(200).json(resultado);
        });
    }
};

module.exports = ProdutoController;
