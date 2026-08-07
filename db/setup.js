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
const ARQUIVO_INDICES = path.join(__dirname, 'indexes.sql');
const ARQUIVO_CARGA = path.join(__dirname, 'seed.sql');

const reset = process.argv.includes('--reset');

const encerrarComErro = (mensagem, erro) => {
    console.error(`\n${mensagem}`);
    if (erro) console.error(erro.message);
    process.exit(1);
};

// Colunas que o esquema espera. Um banco criado por uma versão anterior do projeto
// não tem publico nem imagem_url, e CREATE TABLE IF NOT EXISTS não adiciona coluna a
// uma tabela que já existe. Esta função aplica o que falta, sem recriar o banco.
const COLUNAS_ESPERADAS = [
    { nome: 'publico', tipo: 'TEXT' },
    { nome: 'imagem_url', tipo: 'TEXT' },
    { nome: 'nome_ordenacao', tipo: 'TEXT' }
];

// Nome sem acento e em minúscula. Precisa casar com chaveDeOrdenacao em
// src/models/ProdutoModel.js, senão a ordenação sai diferente entre a carga e a escrita.
const chaveDeOrdenacao = (texto) =>
    texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

// Preenche nome_ordenacao nas linhas que ainda não têm. Um banco migrado de uma versão
// anterior tem a coluna vazia, e a listagem ordenada sairia com esses produtos no fim.
const preencherOrdenacao = (banco, pronto) => {
    banco.all(
        "SELECT id, nome FROM produtos WHERE nome IS NOT NULL AND (nome_ordenacao IS NULL OR nome_ordenacao = '')",
        (erro, linhas) => {
            if (erro) return pronto(erro);
            if (linhas.length === 0) return pronto(null);

            const proxima = (i) => {
                if (i >= linhas.length) {
                    console.log(`Ordenação preenchida em ${linhas.length} produtos.`);
                    return pronto(null);
                }
                banco.run(
                    'UPDATE produtos SET nome_ordenacao = ? WHERE id = ?',
                    [chaveDeOrdenacao(linhas[i].nome), linhas[i].id],
                    (erro) => (erro ? pronto(erro) : proxima(i + 1))
                );
            };
            proxima(0);
        }
    );
};

const migrarColunas = (banco, pronto) => {
    banco.all('PRAGMA table_info(produtos)', (erro, colunas) => {
        if (erro) return pronto(erro);

        const existentes = new Set(colunas.map((c) => c.name));
        const faltando = COLUNAS_ESPERADAS.filter((c) => !existentes.has(c.nome));

        if (faltando.length === 0) return pronto(null);

        // Uma coluna por vez. O SQLite não aceita várias em um só ALTER TABLE.
        const proxima = (i) => {
            if (i >= faltando.length) {
                console.log(`Colunas adicionadas: ${faltando.map((c) => c.nome).join(', ')}.`);
                return pronto(null);
            }
            const coluna = faltando[i];
            banco.run(`ALTER TABLE produtos ADD COLUMN ${coluna.nome} ${coluna.tipo}`, (erro) =>
                erro ? pronto(erro) : proxima(i + 1)
            );
        };
        proxima(0);
    });
};

const banco = new sqlite3.Database(CAMINHO_BANCO, (erro) => {
    if (erro) encerrarComErro('Não foi possível abrir o banco.', erro);

    console.log(`Banco: ${CAMINHO_BANCO}`);

    banco.exec(fs.readFileSync(ARQUIVO_ESQUEMA, 'utf8'), (erro) => {
        if (erro) encerrarComErro('Falha ao aplicar o esquema.', erro);
        console.log('Esquema aplicado.');

        migrarColunas(banco, (erro) => {
            if (erro) encerrarComErro('Falha ao migrar as colunas.', erro);

            // Os índices vêm depois da migração, porque um deles usa a coluna publico.
            banco.exec(fs.readFileSync(ARQUIVO_INDICES, 'utf8'), (erro) => {
                if (erro) encerrarComErro('Falha ao criar os índices.', erro);

                preencherOrdenacao(banco, (erro) => {
                    if (erro) encerrarComErro('Falha ao preencher a ordenação.', erro);

                    banco.get('SELECT COUNT(*) AS total FROM produtos', (erro, linha) => {
                        if (erro) encerrarComErro('Falha ao contar os produtos.', erro);

                        // Sem --reset, um banco que já tem dados fica intacto. Isso evita
                        // que o comando apague o estoque de alguém por engano.
                        if (linha.total > 0 && !reset) {
                            console.log(`A tabela já tem ${linha.total} produtos. Nada mudou.`);
                            console.log('Use "npm run db:setup -- --reset" para recarregar.');
                            return banco.close();
                        }

                        banco.exec(fs.readFileSync(ARQUIVO_CARGA, 'utf8'), (erro) => {
                            if (erro) encerrarComErro('Falha ao carregar os dados.', erro);

                            banco.get('SELECT COUNT(*) AS total FROM produtos', (erro, linha) => {
                                if (erro) encerrarComErro('Falha ao contar.', erro);
                                console.log(
                                    `Dados carregados. A tabela tem ${linha.total} produtos.`
                                );
                                banco.close();
                            });
                        });
                    });
                });
            });
        });
    });
});
