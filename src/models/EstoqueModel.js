// Saldo por unidade da loja.
//
// As funções deste arquivo NÃO abrem transação. Elas são os passos que a movimentação
// executa dentro da transação dela, em src/models/MovimentacaoModel.js. Quem abre e
// fecha a transação é sempre o chamador, senão um COMMIT no meio deixaria o saldo
// gravado sem a movimentação que o explica.

const { executar, umaLinha, linhas } = require('./transacao');
const { UNIDADES, UNIDADE_PADRAO } = require('../config/unidades');
const { erroDeValidacao, erroNaoEncontrado } = require('./erros');

const unidadeValida = (unidade) => typeof unidade === 'string' && UNIDADES.includes(unidade.trim());

// O status que a vitrine mostra. Ele é derivado do total, e não guardado à parte, para
// não existir produto com saldo zero marcado como disponível.
const statusPara = (total) => (total > 0 ? 'Em estoque' : 'Sem estoque');

const EstoqueModel = {
    UNIDADES,
    UNIDADE_PADRAO,
    unidadeValida,
    statusPara,

    // Cria com zero a linha que faltar. INSERT OR IGNORE não toca no saldo de uma
    // linha que já existe, portanto esta função pode rodar quantas vezes for.
    garantirLinhas: async (produtoId) => {
        for (const unidade of UNIDADES) {
            await executar(
                'INSERT OR IGNORE INTO estoque (produto_id, unidade, quantidade) VALUES (?, ?, 0)',
                [produtoId, unidade]
            );
        }
    },

    saldoDaUnidade: async (produtoId, unidade) => {
        const linha = await umaLinha(
            'SELECT quantidade FROM estoque WHERE produto_id = ? AND unidade = ?',
            [produtoId, unidade]
        );
        return linha ? linha.quantidade : 0;
    },

    // Soma ou subtrai. O chamador já conferiu que a saída cabe no saldo.
    aplicarDelta: (produtoId, unidade, delta) =>
        executar(
            'UPDATE estoque SET quantidade = quantidade + ? WHERE produto_id = ? AND unidade = ?',
            [delta, produtoId, unidade]
        ),

    // Põe em produtos.quantidade a soma das unidades, e acerta o status junto.
    //
    // produtos.quantidade é um total desnormalizado. Ele existe porque a listagem
    // paginada ordena por quantidade, e um SUM com JOIN em toda página custaria caro.
    // O preço disso é esta função, que precisa rodar na mesma transação da movimentação.
    recalcularTotal: async (produtoId) => {
        await executar(
            `UPDATE produtos
                SET quantidade = (SELECT COALESCE(SUM(quantidade), 0) FROM estoque WHERE produto_id = ?),
                    status_estoque = CASE
                        WHEN (SELECT COALESCE(SUM(quantidade), 0) FROM estoque WHERE produto_id = ?) > 0
                        THEN 'Em estoque' ELSE 'Sem estoque' END
              WHERE id = ?`,
            [produtoId, produtoId, produtoId]
        );
    },

    // Leitura pública do model: o saldo de cada unidade e o total.
    // A rota que expõe isto exige sessão, porque o detalhe por loja é dado de operação.
    porProduto: async (id) => {
        const produto = await umaLinha('SELECT id, nome FROM produtos WHERE id = ?', [Number(id)]);
        if (!produto) throw erroNaoEncontrado('Produto não encontrado.');

        const gravadas = await linhas(
            'SELECT unidade, quantidade FROM estoque WHERE produto_id = ?',
            [Number(id)]
        );
        const porUnidade = new Map(gravadas.map((l) => [l.unidade, l.quantidade]));

        // A saída segue a ordem de UNIDADES, e não a do banco. Assim a tela mostra as
        // lojas sempre na mesma ordem, e uma unidade sem linha aparece com zero em vez
        // de sumir.
        const unidades = UNIDADES.map((unidade) => ({
            unidade,
            quantidade: porUnidade.get(unidade) || 0
        }));

        return {
            produto_id: produto.id,
            nome: produto.nome,
            unidades,
            total: unidades.reduce((soma, u) => soma + u.quantidade, 0)
        };
    },

    // Erro pronto para quem receber uma unidade fora da lista.
    erroDeUnidade: () =>
        erroDeValidacao('A unidade enviada não existe.', [
            `O campo "unidade" precisa ser um destes: ${UNIDADES.join(', ')}.`
        ])
};

module.exports = EstoqueModel;
