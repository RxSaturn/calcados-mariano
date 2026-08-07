const ProdutoModel = require('../models/ProdutoModel');

const ProdutoController = {
    // 1. Função que lista tudo
    listarProdutos: (req, res) => {
        ProdutoModel.listarTodos((erro, resultados) => {
            if (erro) {
                return res.status(500).json({ mensagem: 'Erro interno ao buscar os produtos.' });
            }
            return res.status(200).json(resultados);
        });
    },

    // 2. Função adicionar um novo calçado
    adicionarProduto: (req, res) => {
        // req.body guarda os dados que o site (front-end) envia quando o dono preenche o formulário
        const novoProduto = req.body; 
        
        ProdutoModel.adicionar(novoProduto, (erro) => {
            if (erro) {
                return res.status(500).json({ mensagem: 'Erro ao salvar o produto no banco.' });
            }
            return res.status(201).json({ mensagem: 'Produto adicionado com sucesso!' });
        });
    },

    // 3. Função: Pesquisar produtos
    buscarProdutos: (req, res) => {
        // req.query pega os parâmetros da URL. Ex: ?tipo=numeracao&termo=41
        const tipo = req.query.tipo;
        const termo = req.query.termo;

        ProdutoModel.buscar(termo, tipo, (erro, resultados) => {
            if (erro) {
                // Pedido malformado do cliente. O model marca esses erros com 'validacao'.
                // Antes desta checagem, um pedido sem 'tipo' derrubava o servidor.
                if (erro.validacao) {
                    return res.status(400).json({ mensagem: erro.message });
                }
                return res.status(500).json({ mensagem: 'Erro ao pesquisar os produtos.' });
            }
            return res.status(200).json(resultados);
        });
    }
};

module.exports = ProdutoController;