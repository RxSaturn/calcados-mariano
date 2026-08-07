// Testes da carga inicial e do esquema.
//
// Estes testes existem porque a carga é dado de produto, e não só código. Uma
// categoria escrita errada ou um público fora da lista quebra o filtro da vitrine
// em silêncio, e nenhum teste de rota pegaria isso.
//
// describe, it, expect, beforeAll e afterAll vêm de globals: true no vitest.config.mjs

const { criarBancoDeTeste, contarProdutosDaCarga } = require('./helpers/bancoDeTeste');

const PUBLICOS_ACEITOS = ['Masculino', 'Feminino', 'Infantil', 'Unissex'];

// Valores que a coluna categoria NÃO pode ter, porque descrevem público ou uso, e não
// o tipo do calçado. São exatamente os que apareciam no banco antigo e que forçavam o
// filtro da vitrine a adivinhar por palavra-chave.
const CATEGORIAS_PROIBIDAS = [
    'Esporte',
    'Esportivo',
    'Masculino',
    'Feminino',
    'Infantil',
    'Unissex'
];

let banco;
let produtos;
let colunas;

beforeAll(async () => {
    banco = await criarBancoDeTeste();
    const sqlite3 = require('sqlite3');
    const db = new sqlite3.Database(banco.caminho);

    const consultar = (sql) =>
        new Promise((ok, falha) => db.all(sql, (erro, r) => (erro ? falha(erro) : ok(r))));

    produtos = await consultar('SELECT * FROM produtos ORDER BY id');
    colunas = await consultar('PRAGMA table_info(produtos)');
    await new Promise((ok) => db.close(ok));
});

afterAll(() => banco.limpar());

describe('esquema', () => {
    it('tem as colunas que as duas telas usam', () => {
        const nomes = colunas.map((c) => c.name);

        for (const coluna of [
            'id',
            'nome',
            'numeracao',
            'categoria',
            'publico',
            'quantidade',
            'status_estoque',
            'marca',
            'cor',
            'descricao',
            'imagem_url'
        ]) {
            expect(nomes, `falta a coluna ${coluna}`).toContain(coluna);
        }
    });

    it('não tem coluna de preço', () => {
        // O preço saiu do escopo de propósito. A vitrine não vende, ela encaminha
        // o cliente para o WhatsApp.
        expect(colunas.map((c) => c.name)).not.toContain('preco');
    });
});

describe('carga inicial', () => {
    it('carrega a quantidade que o arquivo declara', () => {
        expect(produtos).toHaveLength(contarProdutosDaCarga());
    });

    it('preenche todos os campos que a vitrine mostra', () => {
        for (const p of produtos) {
            for (const campo of [
                'nome',
                'numeracao',
                'categoria',
                'publico',
                'marca',
                'cor',
                'descricao'
            ]) {
                expect(p[campo], `id ${p.id}, campo ${campo}`).toBeTruthy();
            }
            expect(Number.isInteger(p.quantidade), `id ${p.id}, quantidade`).toBe(true);
        }
    });

    it('usa só públicos da lista aceita', () => {
        for (const p of produtos) {
            expect(PUBLICOS_ACEITOS, `id ${p.id} tem publico ${p.publico}`).toContain(p.publico);
        }
    });

    it('separa público de categoria, e não mistura os dois', () => {
        // O banco antigo tinha 'Esporte' e 'Masculino' na coluna categoria, junto com
        // 'Botina' e 'Sandália'. Era essa mistura que forçava o filtro por palavra-chave.
        // A categoria tem de descrever o tipo do calçado, e nada além disso.
        for (const p of produtos) {
            expect(
                CATEGORIAS_PROIBIDAS,
                `a categoria de ${p.id} é "${p.categoria}", que descreve público ou uso`
            ).not.toContain(p.categoria);
        }
    });

    it('não tem espaço sobrando em nenhum campo de texto', () => {
        for (const p of produtos) {
            for (const [campo, valor] of Object.entries(p)) {
                if (typeof valor === 'string') {
                    expect(valor, `id ${p.id}, campo ${campo}`).toBe(valor.trim());
                }
            }
        }
    });

    it('usa um só valor de status para produto com estoque', () => {
        // O banco antigo misturava 'Em estoque', 'Disponível' e 'Em estoque ' com espaço.
        const status = new Set(
            produtos.filter((p) => p.quantidade > 0).map((p) => p.status_estoque)
        );
        expect(status.size).toBe(1);
    });

    it('dá uma descrição própria a cada produto', () => {
        // A descrição aparece na vitrine. No banco antigo era a mesma frase nos 17.
        const descricoes = new Set(produtos.map((p) => p.descricao));
        expect(descricoes.size).toBe(produtos.length);
    });

    it('não traz produto de teste', () => {
        for (const p of produtos) {
            expect(p.nome.toLowerCase()).not.toContain('exemplo');
            expect(p.nome.toLowerCase()).not.toContain('teste');
        }
    });

    it('cobre os três públicos que a loja vende', () => {
        const publicos = new Set(produtos.map((p) => p.publico));
        for (const esperado of ['Masculino', 'Feminino', 'Unissex']) {
            expect(publicos).toContain(esperado);
        }
    });
});
