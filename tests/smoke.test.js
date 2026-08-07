// Smoke tests. Respondem a pergunta mais básica: o sistema sobe e atende.
// Se estes testes falham, não vale olhar mais nada.

// describe, it, expect, beforeAll e afterAll vêm de globals: true no vitest.config.js
const request = require('supertest');
const { criarBancoDeTeste, contarProdutosDaCarga } = require('./helpers/bancoDeTeste');

let app;
let banco;

beforeAll(async () => {
    banco = await criarBancoDeTeste();
    // O require vem depois de criarBancoDeTeste, porque src/config/db.js lê DB_PATH
    // quando o módulo carrega.
    app = require('../src/app');
});

afterAll(() => banco.limpar());

describe('smoke', () => {
    it('carrega o app sem lançar erro', () => {
        expect(app).toBeDefined();
        expect(typeof app.use).toBe('function');
    });

    it('GET /health responde 200 e diz que o banco respondeu', async () => {
        const resposta = await request(app).get('/health');

        expect(resposta.status).toBe(200);
        expect(resposta.body.status).toBe('ok');
        expect(resposta.body.banco).toBe('conectado');
        expect(resposta.body.produtos).toBe(contarProdutosDaCarga());
    });

    it('GET /produtos responde 200 com um array', async () => {
        const resposta = await request(app).get('/produtos');

        expect(resposta.status).toBe(200);
        expect(Array.isArray(resposta.body)).toBe(true);
        expect(resposta.body).toHaveLength(contarProdutosDaCarga());
    });

    it('GET / responde 200 com texto puro', async () => {
        const resposta = await request(app).get('/');

        expect(resposta.status).toBe(200);
        expect(resposta.text).toContain('Calçados Mariano');
    });
});
