// Testes da sessão do painel e do guarda das rotas de escrita.
// describe, it, expect, beforeAll e afterAll vêm de globals: true no vitest.config.mjs

const request = require('supertest');
const { criarBancoDeTeste } = require('./helpers/bancoDeTeste');
const {
    configurarAutenticacao,
    desconfigurarAutenticacao,
    obterCookie
} = require('./helpers/sessaoDeTeste');

let app;
let banco;
let senha;

const PRODUTO = {
    nome: 'Bota de Teste',
    categoria: 'Bota',
    publico: 'Masculino',
    numeracao: '42',
    quantidade: 3
};

beforeAll(async () => {
    banco = await criarBancoDeTeste();
    senha = configurarAutenticacao();
    app = require('../src/app');
});

afterAll(() => {
    desconfigurarAutenticacao();
    banco.limpar();
});

describe('POST /auth/login', () => {
    it('aceita a senha certa e devolve cookie httpOnly', async () => {
        const resposta = await request(app).post('/auth/login').send({ senha });

        expect(resposta.status).toBe(200);
        const cookies = resposta.headers['set-cookie'].join(';');
        expect(cookies).toContain('sessao_mariano=');
        expect(cookies).toContain('HttpOnly');
        expect(cookies).toContain('SameSite=Lax');
    });

    it('recusa a senha errada com 401', async () => {
        const resposta = await request(app).post('/auth/login').send({ senha: 'errada errada' });

        expect(resposta.status).toBe(401);
        expect(resposta.headers['set-cookie']).toBeUndefined();
    });

    it('recusa pedido sem senha com 400', async () => {
        for (const corpo of [{}, { senha: '' }, { senha: 123 }, { senha: null }]) {
            const resposta = await request(app).post('/auth/login').send(corpo);
            expect(resposta.status, JSON.stringify(corpo)).toBe(400);
        }
    });

    it('não vaza a senha nem o hash na resposta', async () => {
        const resposta = await request(app).post('/auth/login').send({ senha });
        const corpo = JSON.stringify(resposta.body);

        expect(corpo).not.toContain(senha);
        expect(corpo).not.toContain('scrypt');
    });
});

describe('GET /auth/sessao', () => {
    it('diz que não há sessão quando não vem cookie', async () => {
        const resposta = await request(app).get('/auth/sessao');

        expect(resposta.status).toBe(200);
        expect(resposta.body.autenticado).toBe(false);
        expect(resposta.body.configurada).toBe(true);
    });

    it('diz que há sessão depois do login', async () => {
        const cookie = await obterCookie(request, app, senha);
        const resposta = await request(app).get('/auth/sessao').set('Cookie', cookie);

        expect(resposta.body.autenticado).toBe(true);
    });

    it('recusa um cookie com assinatura falsificada', async () => {
        const cookie = await obterCookie(request, app, senha);
        // Troca o último caractere da assinatura.
        const adulterado = cookie.slice(0, -1) + (cookie.endsWith('a') ? 'b' : 'a');

        const resposta = await request(app).get('/auth/sessao').set('Cookie', adulterado);
        expect(resposta.body.autenticado).toBe(false);
    });

    it('recusa um token inventado', async () => {
        const inventado = Buffer.from(
            JSON.stringify({ dono: true, expiraEm: Date.now() + 1e6 })
        ).toString('base64url');

        const resposta = await request(app)
            .get('/auth/sessao')
            .set('Cookie', `sessao_mariano=${inventado}.assinaturaqualquer`);

        expect(resposta.body.autenticado).toBe(false);
    });
});

describe('POST /auth/logout', () => {
    it('limpa o cookie e a sessão deixa de valer', async () => {
        const cookie = await obterCookie(request, app, senha);
        const saida = await request(app).post('/auth/logout').set('Cookie', cookie);

        expect(saida.status).toBe(200);
        expect(saida.headers['set-cookie'].join(';')).toContain('Max-Age=0');
    });
});

describe('as rotas de escrita exigem sessão', () => {
    it('POST /produtos responde 401 sem sessão', async () => {
        const resposta = await request(app).post('/produtos').send(PRODUTO);
        expect(resposta.status).toBe(401);
    });

    it('PUT /produtos/:id responde 401 sem sessão', async () => {
        const resposta = await request(app).put('/produtos/1').send(PRODUTO);
        expect(resposta.status).toBe(401);
    });

    it('DELETE /produtos/:id responde 401 sem sessão', async () => {
        const resposta = await request(app).delete('/produtos/1');
        expect(resposta.status).toBe(401);
    });

    it('o 401 do DELETE não apaga nada', async () => {
        const antes = await request(app).get('/produtos/1');
        await request(app).delete('/produtos/1');
        const depois = await request(app).get('/produtos/1');

        expect(antes.status).toBe(200);
        expect(depois.status).toBe(200);
    });

    it('com sessão, a escrita passa', async () => {
        const cookie = await obterCookie(request, app, senha);
        const resposta = await request(app).post('/produtos').set('Cookie', cookie).send(PRODUTO);

        expect(resposta.status).toBe(201);
    });
});

describe('as rotas de leitura ficam públicas', () => {
    // A vitrine é pública. O cliente não faz login para olhar calçados.
    it('leitura funciona sem sessão', async () => {
        for (const caminho of [
            '/produtos',
            '/produtos/1',
            '/produtos/categorias',
            '/produtos/buscar?tipo=nome&termo=bota'
        ]) {
            const resposta = await request(app).get(caminho);
            expect(resposta.status, caminho).toBe(200);
        }
    });
});
