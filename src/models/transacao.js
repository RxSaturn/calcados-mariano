// Consulta com promessa e transação com fila, sobre a conexão de src/config/db.js.
//
// POR QUE A FILA EXISTE. O projeto usa uma conexão só. Uma transação escrita com
// async/await solta o controle entre um await e o seguinte, portanto dois pedidos ao
// mesmo tempo entrariam assim:
//
//   pedido A: BEGIN ... await SELECT
//   pedido B: BEGIN            <- o SQLite recusa, "cannot start a transaction within a
//                                 transaction", e a operação de A ainda estaria aberta
//
// A fila abaixo faz uma transação esperar a anterior terminar. Uma loja com um painel
// não tem carga que justifique um pool de conexões, e a fila resolve o problema com
// dez linhas em vez de uma dependência nova.

const db = require('../config/db');

const executar = (sql, parametros = []) =>
    new Promise((ok, falha) => {
        db.run(sql, parametros, function (erro) {
            if (erro) return falha(erro);
            ok({ lastID: this.lastID, changes: this.changes });
        });
    });

const umaLinha = (sql, parametros = []) =>
    new Promise((ok, falha) => {
        db.get(sql, parametros, (erro, linha) => (erro ? falha(erro) : ok(linha)));
    });

const linhas = (sql, parametros = []) =>
    new Promise((ok, falha) => {
        db.all(sql, parametros, (erro, resultado) => (erro ? falha(erro) : ok(resultado)));
    });

let fila = Promise.resolve();

const abrirEFechar = async (corpo) => {
    // BEGIN IMMEDIATE pega a trava de escrita já na abertura. Com o BEGIN comum, o
    // SQLite só tenta pegar a trava no primeiro UPDATE, e a falha apareceria no meio
    // da operação em vez de no começo.
    await executar('BEGIN IMMEDIATE');
    try {
        const resultado = await corpo();
        await executar('COMMIT');
        return resultado;
    } catch (erro) {
        // O ROLLBACK desfaz o que já tinha sido gravado. A falha dele é engolida de
        // propósito, para o erro que o chamador recebe ser a causa e não o efeito.
        await executar('ROLLBACK').catch(() => {});
        throw erro;
    }
};

const emTransacao = (corpo) => {
    const proxima = fila.then(
        () => abrirEFechar(corpo),
        () => abrirEFechar(corpo)
    );
    // A fila guarda a versão sem erro, senão uma transação que falha derrubaria as
    // seguintes.
    fila = proxima.catch(() => {});
    return proxima;
};

module.exports = { executar, umaLinha, linhas, emTransacao };
