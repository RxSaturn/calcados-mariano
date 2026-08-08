// Cria o banco de estoque a partir dos arquivos SQL desta pasta.
//
// Uso:
//   npm run db:setup            Aplica o esquema. Carrega os dados só se a tabela estiver vazia.
//   npm run db:setup -- --reset Aplica o esquema e recarrega os dados, apagando o que havia.
//
// O arquivo do banco não é versionado. Veja o item P0-2 do roadmap.
//
// A ordem dos passos importa, e cada um depende do anterior:
//
//   1. Esquema, com CREATE TABLE IF NOT EXISTS.
//   2. Migração das colunas de produtos, com ALTER TABLE.
//   3. Índices, porque um deles usa a coluna publico que o passo 2 acabou de criar.
//   4. Preenchimento de nome_ordenacao nas linhas antigas.
//   5. Carga, só quando a tabela está vazia ou quando vem --reset.
//   6. Abertura do saldo por unidade, que precisa dos produtos já gravados.

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const { garantirEstoqueInicial } = require('./estoque-inicial');
const { UNIDADE_PADRAO } = require('../src/config/unidades');

const RAIZ = path.join(__dirname, '..');
const CAMINHO_BANCO = process.env.DB_PATH || path.join(RAIZ, 'calcados_mariano.db');
const ARQUIVO_ESQUEMA = path.join(__dirname, 'schema.sql');
const ARQUIVO_INDICES = path.join(__dirname, 'indexes.sql');
const ARQUIVO_CARGA = path.join(__dirname, 'seed.sql');

const reset = process.argv.includes('--reset');

// Colunas que o esquema espera. Um banco criado por uma versão anterior do projeto
// não tem publico nem imagem_url, e CREATE TABLE IF NOT EXISTS não adiciona coluna a
// uma tabela que já existe. Esta lista diz o que aplicar com ALTER TABLE.
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

const abrir = (caminho) =>
    new Promise((ok, falha) => {
        const banco = new sqlite3.Database(caminho, (erro) => (erro ? falha(erro) : ok(banco)));
    });

const executarSql = (banco, sql, parametros = []) =>
    new Promise((ok, falha) => {
        banco.run(sql, parametros, (erro) => (erro ? falha(erro) : ok()));
    });

const executarArquivo = (banco, arquivo) =>
    new Promise((ok, falha) => {
        banco.exec(fs.readFileSync(arquivo, 'utf8'), (erro) => (erro ? falha(erro) : ok()));
    });

const consultar = (banco, sql, parametros = []) =>
    new Promise((ok, falha) => {
        banco.all(sql, parametros, (erro, linhas) => (erro ? falha(erro) : ok(linhas)));
    });

const umValor = async (banco, sql) => (await consultar(banco, sql))[0];

// Aplica as colunas que faltam. O SQLite aceita uma coluna por ALTER TABLE.
const migrarColunas = async (banco) => {
    const colunas = await consultar(banco, 'PRAGMA table_info(produtos)');
    const existentes = new Set(colunas.map((c) => c.name));
    const faltando = COLUNAS_ESPERADAS.filter((c) => !existentes.has(c.nome));

    for (const coluna of faltando) {
        await executarSql(banco, `ALTER TABLE produtos ADD COLUMN ${coluna.nome} ${coluna.tipo}`);
    }

    if (faltando.length > 0) {
        console.log(`Colunas adicionadas: ${faltando.map((c) => c.nome).join(', ')}.`);
    }
};

// Preenche nome_ordenacao nas linhas que ainda não têm. Um banco migrado de uma versão
// anterior tem a coluna vazia, e a listagem ordenada sairia com esses produtos no fim.
const preencherOrdenacao = async (banco) => {
    const linhas = await consultar(
        banco,
        "SELECT id, nome FROM produtos WHERE nome IS NOT NULL AND (nome_ordenacao IS NULL OR nome_ordenacao = '')"
    );

    for (const linha of linhas) {
        await executarSql(banco, 'UPDATE produtos SET nome_ordenacao = ? WHERE id = ?', [
            chaveDeOrdenacao(linha.nome),
            linha.id
        ]);
    }

    if (linhas.length > 0) console.log(`Ordenação preenchida em ${linhas.length} produtos.`);
};

const principal = async () => {
    const banco = await abrir(CAMINHO_BANCO);
    console.log(`Banco: ${CAMINHO_BANCO}`);

    // As tabelas estoque e movimentacoes apontam para produtos com chave estrangeira,
    // e o SQLite ignora chave estrangeira por padrão em cada conexão.
    await executarSql(banco, 'PRAGMA foreign_keys = ON');

    await executarArquivo(banco, ARQUIVO_ESQUEMA);
    console.log('Esquema aplicado.');

    await migrarColunas(banco);
    await executarArquivo(banco, ARQUIVO_INDICES);
    await preencherOrdenacao(banco);

    const antes = await umValor(banco, 'SELECT COUNT(*) AS total FROM produtos');

    // Sem --reset, um banco que já tem dados fica intacto. Isso evita que o comando
    // apague o estoque de alguém por engano.
    if (antes.total > 0 && !reset) {
        console.log(`A tabela já tem ${antes.total} produtos. A carga não rodou.`);
        console.log('Use "npm run db:setup -- --reset" para recarregar.');
    } else {
        await executarArquivo(banco, ARQUIVO_CARGA);
        const depois = await umValor(banco, 'SELECT COUNT(*) AS total FROM produtos');
        console.log(`Dados carregados. A tabela tem ${depois.total} produtos.`);
    }

    // A abertura do saldo roda nos dois caminhos, porque um banco que pulou a carga
    // pode mesmo assim ser da versão anterior, sem nenhuma linha em estoque.
    const { produtosAbertos } = await garantirEstoqueInicial(banco);
    if (produtosAbertos > 0) {
        console.log(`Saldo aberto em ${produtosAbertos} produtos, todo na ${UNIDADE_PADRAO}.`);
        console.log('Confira o saldo real de cada unidade antes de usar o painel.');
    }

    await new Promise((ok) => banco.close(ok));
};

principal().catch((erro) => {
    console.error('\nFalha ao preparar o banco.');
    console.error(erro.message);
    process.exit(1);
});
