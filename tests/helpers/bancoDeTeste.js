const fs = require('fs');
const os = require('os');
const path = require('path');
const sqlite3 = require('sqlite3');

const RAIZ = path.join(__dirname, '..', '..');
const ARQUIVO_ESQUEMA = path.join(RAIZ, 'db', 'schema.sql');
const ARQUIVO_INDICES = path.join(RAIZ, 'db', 'indexes.sql');
const ARQUIVO_CARGA = path.join(RAIZ, 'db', 'seed.sql');

// Cria um banco temporário a partir dos mesmos arquivos SQL que o npm run db:setup usa.
// Cada arquivo de teste recebe o seu próprio banco, portanto um teste não vê os dados
// de outro. Chame esta função ANTES de importar src/app.js, porque src/config/db.js lê
// DB_PATH no momento em que o módulo carrega.
const criarBancoDeTeste = async ({ comDados = true } = {}) => {
    const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'mariano-teste-'));
    const caminho = path.join(pasta, 'teste.db');

    process.env.DB_PATH = caminho;
    process.env.DB_QUIET = '1';

    const banco = new sqlite3.Database(caminho);
    const executar = (sql) =>
        new Promise((ok, falha) => {
            banco.exec(sql, (erro) => (erro ? falha(erro) : ok()));
        });

    // Mesma ordem do db/setup.js: tabela, depois índices. O banco de teste nasce
    // com as colunas todas, portanto não precisa do passo de migração.
    await executar(fs.readFileSync(ARQUIVO_ESQUEMA, 'utf8'));
    await executar(fs.readFileSync(ARQUIVO_INDICES, 'utf8'));
    if (comDados) {
        await executar(fs.readFileSync(ARQUIVO_CARGA, 'utf8'));
    }
    await new Promise((ok) => banco.close(ok));

    return {
        caminho,
        // Remove a pasta temporária. Chame no afterAll de cada arquivo de teste.
        limpar: () => fs.rmSync(pasta, { recursive: true, force: true })
    };
};

// Quantos produtos o db/seed.sql carrega. Os testes comparam com este número em vez de
// repetir o literal 13, para que a carga possa crescer sem quebrar as asserções.
const contarProdutosDaCarga = () => {
    const carga = fs.readFileSync(ARQUIVO_CARGA, 'utf8');
    return (carga.match(/^INSERT INTO produtos/gm) || []).length;
};

module.exports = { criarBancoDeTeste, contarProdutosDaCarga };
