// Abre o saldo por unidade dos produtos que ainda não têm.
//
// Este passo roda em dois caminhos, e por isso mora num arquivo só:
//
//   1. db/setup.js, sobre o banco de verdade, depois do esquema e da carga.
//   2. tests/helpers/bancoDeTeste.js, sobre o banco temporário de cada teste.
//
// A função recebe a conexão pronta em vez de abrir uma. Assim ela não depende de
// src/config/db.js, e o db/setup.js continua com uma conexão só.
//
// SOBRE A ESCOLHA DA UNIDADE. O banco anterior guardava um número só em
// produtos.quantidade, e não dizia de qual loja ele era. A migração põe esse saldo
// inteiro na unidade padrão e zero nas demais. Isso é uma escolha, e não um fato: o
// time precisa conferir o saldo real de cada loja e mover o que estiver no lugar
// errado com POST /produtos/:id/movimentacoes. O README diz o mesmo.

const { UNIDADES, UNIDADE_PADRAO } = require('../src/config/unidades');

const MOTIVO_ABERTURA = 'Saldo migrado';

const executar = (banco, sql, parametros = []) =>
    new Promise((ok, falha) => {
        banco.run(sql, parametros, function (erro) {
            if (erro) return falha(erro);
            ok({ lastID: this.lastID, changes: this.changes });
        });
    });

const consultar = (banco, sql, parametros = []) =>
    new Promise((ok, falha) => {
        banco.all(sql, parametros, (erro, linhas) => (erro ? falha(erro) : ok(linhas)));
    });

const garantirEstoqueInicial = async (banco) => {
    // Produtos que ainda não têm linha nenhuma de estoque. Um produto que já tem
    // saldo fica de fora, senão a migração somaria o total de novo a cada execução.
    const semEstoque = await consultar(
        banco,
        'SELECT id, quantidade FROM produtos WHERE id NOT IN (SELECT produto_id FROM estoque)'
    );

    const agora = new Date().toISOString();

    for (const produto of semEstoque) {
        const quantidade = Number.isInteger(produto.quantidade) ? produto.quantidade : 0;

        await executar(
            banco,
            'INSERT INTO estoque (produto_id, unidade, quantidade) VALUES (?, ?, ?)',
            [produto.id, UNIDADE_PADRAO, quantidade]
        );

        // Um saldo de abertura zero não vira movimentação, porque nada entrou.
        if (quantidade > 0) {
            await executar(
                banco,
                `INSERT INTO movimentacoes (produto_id, unidade, tipo, quantidade, motivo, criado_em)
                 VALUES (?, ?, 'entrada', ?, ?, ?)`,
                [produto.id, UNIDADE_PADRAO, quantidade, MOTIVO_ABERTURA, agora]
            );
        }
    }

    // Completa as unidades que faltam, com zero. Este passo é separado do anterior
    // para cobrir também o caso de uma unidade nova entrar em src/config/unidades.js
    // depois de o banco já existir.
    for (const unidade of UNIDADES) {
        await executar(
            banco,
            `INSERT OR IGNORE INTO estoque (produto_id, unidade, quantidade)
             SELECT id, ?, 0 FROM produtos`,
            [unidade]
        );
    }

    return { produtosAbertos: semEstoque.length };
};

module.exports = { garantirEstoqueInicial, MOTIVO_ABERTURA };
