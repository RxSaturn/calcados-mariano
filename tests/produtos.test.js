// Testes de integração das três rotas de produto, pela camada HTTP.
// describe, it, expect, beforeAll e afterAll vêm de globals: true no vitest.config.mjs

const request = require('supertest');
const { criarBancoDeTeste, contarProdutosDaCarga } = require('./helpers/bancoDeTeste');
const {
    configurarAutenticacao,
    desconfigurarAutenticacao,
    obterCookie
} = require('./helpers/sessaoDeTeste');

let app;
let banco;
let cookie;
const TOTAL_DA_CARGA = contarProdutosDaCarga();

beforeAll(async () => {
    banco = await criarBancoDeTeste();
    const senha = configurarAutenticacao();
    app = require('../src/app');
    // As rotas de escrita exigem sessão. A leitura continua pública.
    cookie = await obterCookie(request, app, senha);
});

afterAll(() => {
    desconfigurarAutenticacao();
    banco.limpar();
});

describe('GET /produtos', () => {
    it('lista todos os produtos da carga inicial', async () => {
        const resposta = await request(app).get('/produtos');

        expect(resposta.status).toBe(200);
        expect(resposta.body.produtos).toHaveLength(TOTAL_DA_CARGA);
    });

    it('devolve as colunas de estoque em cada produto', async () => {
        const resposta = await request(app).get('/produtos');
        const produto = resposta.body.produtos[0];

        expect(produto).toHaveProperty('id');
        expect(produto).toHaveProperty('nome');
        expect(produto).toHaveProperty('numeracao');
        expect(produto).toHaveProperty('categoria');
        expect(produto).toHaveProperty('quantidade');
        expect(produto).toHaveProperty('status_estoque');
    });

    it('não traz espaços sobrando nos textos da carga', async () => {
        // O banco antigo tinha a categoria 'Tênis de Futsal\r\n' e o status
        // 'Em estoque ', e esses espaços quebram filtro por igualdade exata.
        const resposta = await request(app).get('/produtos');

        for (const produto of resposta.body.produtos) {
            for (const campo of ['nome', 'numeracao', 'categoria', 'status_estoque']) {
                const valor = produto[campo];
                if (typeof valor === 'string') {
                    expect(valor).toBe(valor.trim());
                }
            }
        }
    });
});

describe('GET /produtos/buscar', () => {
    it('filtra por nome, com busca parcial', async () => {
        const resposta = await request(app).get('/produtos/buscar?tipo=nome&termo=bota');

        expect(resposta.status).toBe(200);
        expect(resposta.body.length).toBeGreaterThan(0);
        for (const produto of resposta.body) {
            expect(produto.nome.toLowerCase()).toContain('bota');
        }
    });

    it('filtra por categoria, com busca parcial', async () => {
        const resposta = await request(app).get('/produtos/buscar?tipo=categoria&termo=Chuteira');

        expect(resposta.status).toBe(200);
        expect(resposta.body.length).toBeGreaterThan(0);
        for (const produto of resposta.body) {
            expect(produto.categoria).toContain('Chuteira');
        }
    });

    it('filtra por numeração, com igualdade exata', async () => {
        const resposta = await request(app).get('/produtos/buscar?tipo=numeracao&termo=41');

        expect(resposta.status).toBe(200);
        expect(resposta.body.length).toBeGreaterThan(0);
        for (const produto of resposta.body) {
            expect(produto.numeracao).toBe('41');
        }
    });

    it('devolve array vazio quando nada casa, e não erro', async () => {
        const resposta = await request(app).get('/produtos/buscar?tipo=numeracao&termo=99');

        expect(resposta.status).toBe(200);
        expect(resposta.body).toEqual([]);
    });

    // ---- Regressão do item P0-1 ----
    // Antes da correção, um pedido sem 'tipo' derrubava o processo do servidor com
    // segmentation fault e código de saída 139. O model montava uma consulta vazia e
    // o driver sqlite3 falhava em código nativo.

    it('responde 400 quando falta o parâmetro tipo', async () => {
        const resposta = await request(app).get('/produtos/buscar?termo=41');

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toContain('tipo');
    });

    it('responde 400 quando o tipo não está na lista aceita', async () => {
        const resposta = await request(app).get('/produtos/buscar?tipo=cor&termo=azul');

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toContain('tipo');
    });

    it('responde 400 quando falta o parâmetro termo', async () => {
        const resposta = await request(app).get('/produtos/buscar?tipo=nome');

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toContain('termo');
    });

    it('responde 400 para nomes herdados de Object usados como tipo', async () => {
        // TIPOS_DE_BUSCA['constructor'] devolveria um valor sem hasOwnProperty.
        for (const tipo of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
            const resposta = await request(app).get(`/produtos/buscar?tipo=${tipo}&termo=x`);
            expect(resposta.status, `tipo=${tipo}`).toBe(400);
        }
    });

    it('continua atendendo depois de uma sequência de pedidos inválidos', async () => {
        // Prova que o pedido inválido não derruba o processo.
        for (let i = 0; i < 25; i += 1) {
            await request(app).get('/produtos/buscar?termo=41');
        }

        const resposta = await request(app).get('/health');
        expect(resposta.status).toBe(200);
    });
});

describe('POST /produtos', () => {
    it('grava um produto e responde 201', async () => {
        const novo = {
            nome: 'Tênis de Teste',
            categoria: 'Teste',
            publico: 'Unissex',
            quantidade: 5,
            status_estoque: 'Em estoque',
            numeracao: '43'
        };

        const criacao = await request(app).post('/produtos').set('Cookie', cookie).send(novo);
        expect(criacao.status).toBe(201);

        const lista = await request(app).get('/produtos?limite=100');
        const gravado = lista.body.produtos.find((p) => p.nome === novo.nome);

        expect(gravado).toBeDefined();
        expect(gravado.quantidade).toBe(novo.quantidade);
        expect(gravado.numeracao).toBe(novo.numeracao);
        expect(gravado.categoria).toBe(novo.categoria);
    });

    it('responde 400 quando o corpo está vazio', async () => {
        const resposta = await request(app).post('/produtos').set('Cookie', cookie).send({});

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toBeDefined();
    });

    it('responde 400 quando falta o nome', async () => {
        const resposta = await request(app).post('/produtos').set('Cookie', cookie).send({
            categoria: 'Teste',
            publico: 'Unissex',
            quantidade: 1,
            status_estoque: 'Em estoque',
            numeracao: '40'
        });

        expect(resposta.status).toBe(400);
    });

    it('responde 400 quando a quantidade não é um número', async () => {
        const resposta = await request(app).post('/produtos').set('Cookie', cookie).send({
            nome: 'Produto Ruim',
            categoria: 'Teste',
            publico: 'Unissex',
            quantidade: 'muitos',
            status_estoque: 'Em estoque',
            numeracao: '40'
        });

        expect(resposta.status).toBe(400);
    });
});
