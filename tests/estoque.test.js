// Testes do saldo por unidade: abertura, leitura e o acordo entre produtos.quantidade
// e a soma da tabela estoque.
// describe, it, expect, beforeAll e afterAll vêm de globals: true no vitest.config.mjs

const request = require('supertest');
const { criarBancoDeTeste, contarProdutosDaCarga } = require('./helpers/bancoDeTeste');
const {
    configurarAutenticacao,
    desconfigurarAutenticacao,
    obterCookie
} = require('./helpers/sessaoDeTeste');
const { UNIDADES, UNIDADE_PADRAO } = require('../src/config/unidades');

let app;
let banco;
let cookie;
const TOTAL = contarProdutosDaCarga();

const PRODUTO = {
    nome: 'Bota de Estoque',
    categoria: 'Bota',
    publico: 'Masculino',
    numeracao: '41',
    quantidade: 10
};

beforeAll(async () => {
    banco = await criarBancoDeTeste();
    const senha = configurarAutenticacao();
    app = require('../src/app');
    cookie = await obterCookie(request, app, senha);
});

afterAll(() => {
    desconfigurarAutenticacao();
    banco.limpar();
});

const criar = (extra = {}) =>
    request(app)
        .post('/produtos')
        .set('Cookie', cookie)
        .send({ ...PRODUTO, ...extra });

const estoqueDe = (id) => request(app).get(`/produtos/${id}/estoque`).set('Cookie', cookie);

describe('GET /produtos/:id/estoque', () => {
    it('devolve uma linha por unidade, sempre na mesma ordem', async () => {
        const { status, body } = await estoqueDe(1);

        expect(status).toBe(200);
        expect(body.produto_id).toBe(1);
        expect(body.unidades.map((u) => u.unidade)).toEqual(UNIDADES);
    });

    it('o total bate com a quantidade que a listagem mostra', async () => {
        const saldo = await estoqueDe(1);
        const produto = await request(app).get('/produtos/1');

        expect(saldo.body.total).toBe(produto.body.quantidade);
    });

    it('exige sessão, porque o saldo por loja é dado de operação', async () => {
        const resposta = await request(app).get('/produtos/1/estoque');
        expect(resposta.status).toBe(401);
    });

    it('responde 404 para produto que não existe e 400 para id inválido', async () => {
        expect((await estoqueDe(999999)).status).toBe(404);

        for (const id of ['0', '-1', 'abc', '1.5']) {
            const { status } = await estoqueDe(id);
            expect(status, id).toBe(400);
        }
    });
});

describe('abertura do saldo na migração', () => {
    it('põe todo o saldo da carga na unidade padrão', async () => {
        // Esta é a escolha que o time precisa conferir depois: o banco antigo tinha um
        // número só, e não dizia de qual loja ele era.
        const { body } = await estoqueDe(1);
        const padrao = body.unidades.find((u) => u.unidade === UNIDADE_PADRAO);
        const outras = body.unidades.filter((u) => u.unidade !== UNIDADE_PADRAO);

        expect(padrao.quantidade).toBe(body.total);
        for (const unidade of outras) {
            expect(unidade.quantidade, unidade.unidade).toBe(0);
        }
    });

    it('deixa uma movimentação de abertura para cada produto com saldo', async () => {
        const { body } = await request(app).get('/produtos/1/movimentacoes').set('Cookie', cookie);

        expect(body.total).toBeGreaterThanOrEqual(1);
        const abertura = body.movimentacoes[body.movimentacoes.length - 1];
        expect(abertura.tipo).toBe('entrada');
        expect(abertura.motivo).toBe('Saldo migrado');
        expect(abertura.unidade).toBe(UNIDADE_PADRAO);
    });

    it('a soma do estoque bate com produtos.quantidade em todos os produtos da carga', async () => {
        const lista = await request(app).get('/produtos?limite=100');
        expect(lista.body.total).toBeGreaterThanOrEqual(TOTAL);

        for (const produto of lista.body.produtos) {
            const { body } = await estoqueDe(produto.id);
            expect(body.total, produto.nome).toBe(produto.quantidade);
        }
    });
});

describe('POST /produtos abre o saldo', () => {
    it('põe a quantidade do cadastro na unidade padrão', async () => {
        const criacao = await criar({ nome: 'Cadastro Padrao', quantidade: 10 });
        const { body } = await estoqueDe(criacao.body.id);

        expect(body.total).toBe(10);
        expect(body.unidades.find((u) => u.unidade === UNIDADE_PADRAO).quantidade).toBe(10);
    });

    it('aceita a unidade escolhida no cadastro', async () => {
        const outra = UNIDADES.find((u) => u !== UNIDADE_PADRAO);
        const criacao = await criar({ nome: 'Cadastro na Outra', quantidade: 5, unidade: outra });

        const { body } = await estoqueDe(criacao.body.id);
        expect(body.unidades.find((u) => u.unidade === outra).quantidade).toBe(5);
        expect(body.unidades.find((u) => u.unidade === UNIDADE_PADRAO).quantidade).toBe(0);
    });

    it('recusa unidade fora da lista, e não grava o produto', async () => {
        const antes = await request(app).get('/produtos?limite=100');

        const resposta = await criar({ nome: 'Unidade Errada', unidade: 'Depósito' });
        expect(resposta.status).toBe(400);
        expect(resposta.body.erros.join(' ')).toContain('unidade');

        const depois = await request(app).get('/produtos?limite=100');
        expect(depois.body.total).toBe(antes.body.total);
    });

    it('cadastro com saldo zero cria as linhas e nenhuma movimentação', async () => {
        const criacao = await criar({ nome: 'Cadastro Zerado', quantidade: 0 });

        const saldo = await estoqueDe(criacao.body.id);
        expect(saldo.body.total).toBe(0);
        expect(saldo.body.unidades).toHaveLength(UNIDADES.length);

        const historico = await request(app)
            .get(`/produtos/${criacao.body.id}/movimentacoes`)
            .set('Cookie', cookie);
        expect(historico.body.total).toBe(0);
    });

    it('registra a entrada de abertura com o motivo do cadastro', async () => {
        const criacao = await criar({ nome: 'Cadastro Com Motivo', quantidade: 3 });

        const { body } = await request(app)
            .get(`/produtos/${criacao.body.id}/movimentacoes`)
            .set('Cookie', cookie);

        expect(body.total).toBe(1);
        expect(body.movimentacoes[0].motivo).toBe('Cadastro inicial');
        expect(body.movimentacoes[0].quantidade).toBe(3);
    });
});

describe('DELETE /produtos/:id leva o saldo junto', () => {
    it('não deixa linha de estoque órfã', async () => {
        const criacao = await criar({ nome: 'Para Apagar Com Saldo', quantidade: 2 });
        const id = criacao.body.id;

        await request(app).delete(`/produtos/${id}`).set('Cookie', cookie);

        // O produto sumiu, portanto a rota de estoque responde 404 e não um saldo solto.
        expect((await estoqueDe(id)).status).toBe(404);

        // E o id, se voltar a existir, nasce sem herdar o saldo do produto anterior.
        const novo = await criar({ nome: 'Depois da Remocao', quantidade: 1 });
        const saldo = await estoqueDe(novo.body.id);
        expect(saldo.body.total).toBe(1);
    });
});
