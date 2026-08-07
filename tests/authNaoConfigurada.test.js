// Comportamento quando ADMIN_SENHA_HASH e SESSAO_SEGREDO não existem.
//
// Este arquivo é separado de propósito. Cada arquivo de teste roda em um processo próprio,
// portanto aqui as variáveis ficam ausentes sem afetar os outros testes.
//
// A regra que importa: sem configuração, o servidor NÃO libera a escrita e NÃO aceita
// qualquer senha. Ele responde 503 e diz o que falta.

const request = require('supertest');
const { criarBancoDeTeste } = require('./helpers/bancoDeTeste');
const { desconfigurarAutenticacao } = require('./helpers/sessaoDeTeste');

let app;
let banco;

beforeAll(async () => {
    banco = await criarBancoDeTeste();
    desconfigurarAutenticacao();
    app = require('../src/app');
});

afterAll(() => banco.limpar());

describe('sem autenticação configurada', () => {
    it('o login responde 503, e não 401', async () => {
        const resposta = await request(app).post('/auth/login').send({ senha: 'qualquer coisa' });

        expect(resposta.status).toBe(503);
        expect(resposta.body.mensagem).toContain('ADMIN_SENHA_HASH');
    });

    it('nenhuma senha é aceita', async () => {
        for (const senha of ['', 'admin', '123456', 'senha']) {
            const resposta = await request(app).post('/auth/login').send({ senha });
            expect(resposta.status, senha).not.toBe(200);
            expect(resposta.headers['set-cookie']).toBeUndefined();
        }
    });

    it('a escrita fica bloqueada com 503, e não liberada', async () => {
        const produto = {
            nome: 'Bota Sem Auth',
            categoria: 'Bota',
            publico: 'Masculino',
            numeracao: '42',
            quantidade: 1
        };

        expect((await request(app).post('/produtos').send(produto)).status).toBe(503);
        expect((await request(app).put('/produtos/1').send(produto)).status).toBe(503);
        expect((await request(app).delete('/produtos/1')).status).toBe(503);
    });

    it('a escrita bloqueada não altera o banco', async () => {
        const antes = await request(app).get('/produtos');
        await request(app).delete('/produtos/1');
        const depois = await request(app).get('/produtos');

        expect(depois.body.total).toBe(antes.body.total);
    });

    it('a leitura continua funcionando', async () => {
        const resposta = await request(app).get('/produtos');
        expect(resposta.status).toBe(200);
    });

    it('a sessão informa que a autenticação não está configurada', async () => {
        const resposta = await request(app).get('/auth/sessao');

        expect(resposta.body.configurada).toBe(false);
        expect(resposta.body.autenticado).toBe(false);
    });
});
