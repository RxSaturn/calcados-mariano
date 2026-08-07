const db = require('../config/db');

const HealthModel = {
    // Pergunta ao banco quantos produtos existem.
    //
    // A consulta toca a tabela produtos de propósito. Uma consulta como 'SELECT 1'
    // provaria só que a conexão abriu. O driver sqlite3 cria um arquivo vazio quando
    // o banco não existe, portanto 'SELECT 1' passaria em um clone onde ninguém rodou
    // "npm run db:setup", e todas as rotas de produto falhariam depois.
    verificarBanco: (callback) => {
        db.get('SELECT COUNT(*) AS total FROM produtos', callback);
    }
};

module.exports = HealthModel;
