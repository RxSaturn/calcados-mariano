// Cria o banco de estoque a partir dos arquivos SQL desta pasta.
//
// Uso:
//   npm run db:setup            Aplica o esquema. Carrega os dados só se a tabela estiver vazia.
//   npm run db:setup -- --reset Aplica o esquema e recarrega os dados, apagando o que havia.
//
// O arquivo do banco não é versionado. Veja o item P0-2 do roadmap.

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const RAIZ = path.join(__dirname, '..');
const CAMINHO_BANCO = process.env.DB_PATH || path.join(RAIZ, 'calcados_mariano.db');
const ARQUIVO_ESQUEMA = path.join(__dirname, 'schema.sql');
const ARQUIVO_CARGA = path.join(__dirname, 'seed.sql');

const reset = process.argv.includes('--reset');

const encerrarComErro = (mensagem, erro) => {
    console.error(`\n${mensagem}`);
    if (erro) console.error(erro.message);
    process.exit(1);
};

const banco = new sqlite3.Database(CAMINHO_BANCO, (erro) => {
    if (erro) encerrarComErro('Não foi possível abrir o banco.', erro);

    console.log(`Banco: ${CAMINHO_BANCO}`);

    banco.exec(fs.readFileSync(ARQUIVO_ESQUEMA, 'utf8'), (erro) => {
        if (erro) encerrarComErro('Falha ao aplicar o esquema.', erro);
        console.log('Esquema aplicado.');

        banco.get('SELECT COUNT(*) AS total FROM produtos', (erro, linha) => {
            if (erro) encerrarComErro('Falha ao contar os produtos.', erro);

            // Sem --reset, um banco que já tem dados fica intacto. Isso evita que o
            // comando apague o estoque de alguém por engano.
            if (linha.total > 0 && !reset) {
                console.log(`A tabela já tem ${linha.total} produtos. Nada foi alterado.`);
                console.log('Use "npm run db:setup -- --reset" para recarregar os dados.');
                return banco.close();
            }

            banco.exec(fs.readFileSync(ARQUIVO_CARGA, 'utf8'), (erro) => {
                if (erro) encerrarComErro('Falha ao carregar os dados.', erro);

                banco.get('SELECT COUNT(*) AS total FROM produtos', (erro, linha) => {
                    if (erro) encerrarComErro('Falha ao contar os produtos.', erro);
                    console.log(`Dados carregados. A tabela tem ${linha.total} produtos.`);
                    banco.close();
                });
            });
        });
    });
});
