const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Caminho do banco. A variável de ambiente DB_PATH tem prioridade, e é assim que os
// testes apontam para um banco temporário. Sem ela, o padrão é o arquivo na raiz do
// projeto, resolvido a partir deste arquivo. O caminho não depende da pasta atual,
// portanto o servidor funciona mesmo lançado de outro lugar.
const CAMINHO_PADRAO = path.join(__dirname, '..', '..', 'calcados_mariano.db');
const caminhoBanco = process.env.DB_PATH || CAMINHO_PADRAO;

// O modo silencioso evita poluir a saída dos testes com o log de conexão.
const silencioso = process.env.DB_QUIET === '1' || process.env.NODE_ENV === 'test';

const conexao = new sqlite3.Database(caminhoBanco, (erro) => {
    if (erro) {
        console.error('Erro ao conectar no SQLite:', erro.message);
    } else if (!silencioso) {
        console.log('Conectado ao banco de dados SQLite da Calçados Mariano!');
    }
});

// O SQLite ignora chave estrangeira por padrão, em cada conexão. Sem este PRAGMA, o
// ON DELETE CASCADE das tabelas estoque e movimentacoes não roda, e remover um produto
// deixaria linhas órfãs apontando para um id que não existe mais.
//
// A chamada fica aqui, fora do callback de abertura, porque o driver enfileira os
// comandos na ordem em que chegam. Assim o PRAGMA é o primeiro comando da conexão,
// antes de qualquer consulta.
conexao.run('PRAGMA foreign_keys = ON', (erro) => {
    if (erro) console.error('Erro ao ligar as chaves estrangeiras:', erro.message);
});

module.exports = conexao;
