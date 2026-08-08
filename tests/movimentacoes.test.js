// Testes da entrada e da saída de estoque, e do histórico.
// describe, it, expect, beforeAll e afterAll vêm de globals: true no vitest.config.mjs

const request = require('supertest');
const { criarBancoDeTeste } = require('./helpers/bancoDeTeste');
const {
    configurarAutenticacao,
    desconfigurarAutenticacao,
    obterCookie
} = require('./helpers/sessaoDeTeste');
const { UNIDADES, UNIDADE_PADRAO } = require('../src/config/unidades');

let app;
let banco;
let cookie;

const OUTRA_UNIDADE = UNIDADES.find((u) => u !== UNIDADE_PADRAO);

const PRODUTO = {
    nome: 'Tenis de Movimentacao',
    categoria: 'Tênis casual',
    publico: 'Unissex',
    numeracao: '40',
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

// Cria um produto e devolve o id. Cada teste usa o seu, para não depender da ordem.
const novoProduto = async (extra = {}) => {
    const resposta = await request(app)
        .post('/produtos')
        .set('Cookie', cookie)
        .send({ ...PRODUTO, ...extra });
    expect(resposta.status).toBe(201);
    return resposta.body.id;
};

const mover = (id, corpo) =>
    request(app).post(`/produtos/${id}/movimentacoes`).set('Cookie', cookie).send(corpo);

const estoqueDe = (id) => request(app).get(`/produtos/${id}/estoque`).set('Cookie', cookie);

const totalDe = async (id) => (await request(app).get(`/produtos/${id}`)).body.quantidade;

const saldoNa = async (id, unidade) => {
    const { body } = await estoqueDe(id);
    return body.unidades.find((u) => u.unidade === unidade).quantidade;
};

describe('POST /produtos/:id/movimentacoes', () => {
    it('a entrada soma no saldo da unidade e no total', async () => {
        const id = await novoProduto({ nome: 'Entrada Simples' });

        const resposta = await mover(id, {
            unidade: UNIDADE_PADRAO,
            tipo: 'entrada',
            quantidade: 4,
            motivo: 'Compra de fornecedor'
        });

        expect(resposta.status).toBe(201);
        expect(resposta.body.saldo).toBe(14);
        expect(await saldoNa(id, UNIDADE_PADRAO)).toBe(14);
        expect(await totalDe(id)).toBe(14);
    });

    it('a saída subtrai', async () => {
        const id = await novoProduto({ nome: 'Saida Simples' });

        const resposta = await mover(id, {
            unidade: UNIDADE_PADRAO,
            tipo: 'saida',
            quantidade: 3,
            motivo: 'Venda no balcão'
        });

        expect(resposta.status).toBe(201);
        expect(await saldoNa(id, UNIDADE_PADRAO)).toBe(7);
        expect(await totalDe(id)).toBe(7);
    });

    it('a saída maior que o saldo responde 400 e não deixa o saldo negativo', async () => {
        const id = await novoProduto({ nome: 'Saida Grande', quantidade: 2 });

        const resposta = await mover(id, {
            unidade: UNIDADE_PADRAO,
            tipo: 'saida',
            quantidade: 3
        });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erros.join(' ')).toContain('estoque');
        expect(await saldoNa(id, UNIDADE_PADRAO)).toBe(2);
        expect(await totalDe(id)).toBe(2);
    });

    it('a saída que zera o saldo passa, porque o limite é o saldo e não o saldo menos um', async () => {
        const id = await novoProduto({ nome: 'Saida Exata', quantidade: 5 });

        const resposta = await mover(id, { unidade: UNIDADE_PADRAO, tipo: 'saida', quantidade: 5 });

        expect(resposta.status).toBe(201);
        expect(await saldoNa(id, UNIDADE_PADRAO)).toBe(0);
    });

    it('o saldo de uma unidade não paga a saída de outra', async () => {
        // O total do produto seria suficiente, mas o par não está nesta loja.
        const id = await novoProduto({ nome: 'Saldo Separado', quantidade: 10 });

        const resposta = await mover(id, { unidade: OUTRA_UNIDADE, tipo: 'saida', quantidade: 1 });

        expect(resposta.status).toBe(400);
        expect(await saldoNa(id, UNIDADE_PADRAO)).toBe(10);
        expect(await saldoNa(id, OUTRA_UNIDADE)).toBe(0);
    });

    it('recusa unidade fora da lista', async () => {
        const id = await novoProduto({ nome: 'Unidade Invalida' });

        for (const unidade of [undefined, null, '', 'Depósito', 'matriz', 42]) {
            const resposta = await mover(id, { unidade, tipo: 'entrada', quantidade: 1 });
            expect(resposta.status, String(unidade)).toBe(400);
            expect(resposta.body.erros.join(' ')).toContain('unidade');
        }

        expect(await totalDe(id)).toBe(10);
    });

    it('recusa tipo fora de entrada e saida', async () => {
        const id = await novoProduto({ nome: 'Tipo Invalido' });

        for (const tipo of [undefined, null, '', 'ajuste', 'ENTRADA', 'saída', 1]) {
            const resposta = await mover(id, { unidade: UNIDADE_PADRAO, tipo, quantidade: 1 });
            expect(resposta.status, String(tipo)).toBe(400);
            expect(resposta.body.erros.join(' ')).toContain('tipo');
        }

        expect(await totalDe(id)).toBe(10);
    });

    it('recusa quantidade que não é inteiro a partir de 1', async () => {
        const id = await novoProduto({ nome: 'Quantidade Invalida' });

        for (const quantidade of [undefined, null, 0, -1, 1.5, '3', NaN]) {
            const resposta = await mover(id, {
                unidade: UNIDADE_PADRAO,
                tipo: 'entrada',
                quantidade
            });
            expect(resposta.status, String(quantidade)).toBe(400);
            expect(resposta.body.erros.join(' ')).toContain('quantidade');
        }

        expect(await totalDe(id)).toBe(10);
    });

    it('recusa motivo longo demais', async () => {
        const id = await novoProduto({ nome: 'Motivo Longo' });

        const resposta = await mover(id, {
            unidade: UNIDADE_PADRAO,
            tipo: 'entrada',
            quantidade: 1,
            motivo: 'x'.repeat(201)
        });

        expect(resposta.status).toBe(400);
        expect(resposta.body.erros.join(' ')).toContain('motivo');
    });

    it('aceita movimentação sem motivo, e grava nulo', async () => {
        const id = await novoProduto({ nome: 'Sem Motivo' });

        expect(
            (await mover(id, { unidade: UNIDADE_PADRAO, tipo: 'entrada', quantidade: 1 })).status
        ).toBe(201);

        const { body } = await request(app)
            .get(`/produtos/${id}/movimentacoes`)
            .set('Cookie', cookie);
        expect(body.movimentacoes[0].motivo).toBeNull();
    });

    it('responde 404 para produto que não existe, e 400 para id inválido', async () => {
        const corpo = { unidade: UNIDADE_PADRAO, tipo: 'entrada', quantidade: 1 };

        expect((await mover(999999, corpo)).status).toBe(404);

        for (const id of ['0', '-1', 'abc']) {
            expect((await mover(id, corpo)).status, id).toBe(400);
        }
    });

    it('exige sessão', async () => {
        const id = await novoProduto({ nome: 'Sem Sessao' });

        const resposta = await request(app)
            .post(`/produtos/${id}/movimentacoes`)
            .send({ unidade: UNIDADE_PADRAO, tipo: 'saida', quantidade: 1 });

        expect(resposta.status).toBe(401);
        expect(await totalDe(id)).toBe(10);
    });
});

describe('o total desnormalizado acompanha a soma do estoque', () => {
    it('continua igual depois de uma sequência de movimentações', async () => {
        const id = await novoProduto({ nome: 'Sequencia Longa', quantidade: 6 });

        const passos = [
            { unidade: UNIDADE_PADRAO, tipo: 'entrada', quantidade: 5 },
            { unidade: OUTRA_UNIDADE, tipo: 'entrada', quantidade: 7 },
            { unidade: UNIDADE_PADRAO, tipo: 'saida', quantidade: 4 },
            { unidade: OUTRA_UNIDADE, tipo: 'saida', quantidade: 2 },
            { unidade: UNIDADE_PADRAO, tipo: 'entrada', quantidade: 1 }
        ];

        for (const passo of passos) {
            expect((await mover(id, passo)).status, JSON.stringify(passo)).toBe(201);

            const saldo = await estoqueDe(id);
            const soma = saldo.body.unidades.reduce((total, u) => total + u.quantidade, 0);

            // As três leituras precisam concordar: a soma das unidades, o total que a
            // rota de estoque devolve, e produtos.quantidade.
            expect(saldo.body.total).toBe(soma);
            expect(await totalDe(id)).toBe(soma);
        }

        expect(await totalDe(id)).toBe(6 + 5 + 7 - 4 - 2 + 1);
    });

    it('a movimentação recusada não muda o total', async () => {
        const id = await novoProduto({ nome: 'Recusa Sem Efeito', quantidade: 3 });

        await mover(id, { unidade: UNIDADE_PADRAO, tipo: 'saida', quantidade: 99 });
        await mover(id, { unidade: 'Depósito', tipo: 'entrada', quantidade: 5 });
        await mover(id, { unidade: UNIDADE_PADRAO, tipo: 'ajuste', quantidade: 5 });

        expect(await totalDe(id)).toBe(3);

        const { body } = await request(app)
            .get(`/produtos/${id}/movimentacoes`)
            .set('Cookie', cookie);

        // Só a entrada do cadastro ficou. Nenhuma recusa deixou linha no histórico.
        expect(body.total).toBe(1);
    });

    it('o status acompanha o saldo', async () => {
        const id = await novoProduto({ nome: 'Status Acompanha', quantidade: 2 });

        await mover(id, { unidade: UNIDADE_PADRAO, tipo: 'saida', quantidade: 2 });
        expect((await request(app).get(`/produtos/${id}`)).body.status_estoque).toBe('Sem estoque');

        await mover(id, { unidade: OUTRA_UNIDADE, tipo: 'entrada', quantidade: 1 });
        expect((await request(app).get(`/produtos/${id}`)).body.status_estoque).toBe('Em estoque');
    });
});

describe('GET /produtos/:id/movimentacoes', () => {
    it('lista do mais recente para o mais antigo', async () => {
        const id = await novoProduto({ nome: 'Historico Ordenado' });

        await mover(id, {
            unidade: UNIDADE_PADRAO,
            tipo: 'entrada',
            quantidade: 1,
            motivo: 'primeira'
        });
        await mover(id, {
            unidade: UNIDADE_PADRAO,
            tipo: 'saida',
            quantidade: 1,
            motivo: 'segunda'
        });

        const { body } = await request(app)
            .get(`/produtos/${id}/movimentacoes`)
            .set('Cookie', cookie);

        expect(body.movimentacoes[0].motivo).toBe('segunda');
        expect(body.movimentacoes[1].motivo).toBe('primeira');
        expect(body.movimentacoes[2].motivo).toBe('Cadastro inicial');
    });

    it('devolve um envelope com total, pagina, limite e paginas', async () => {
        const id = await novoProduto({ nome: 'Historico Envelope' });

        const { status, body } = await request(app)
            .get(`/produtos/${id}/movimentacoes`)
            .set('Cookie', cookie);

        expect(status).toBe(200);
        expect(body.total).toBe(1);
        expect(body.pagina).toBe(1);
        expect(body.limite).toBe(50);
        expect(body.paginas).toBe(1);
    });

    it('pagina sem repetir linha', async () => {
        const id = await novoProduto({ nome: 'Historico Paginado' });

        for (let i = 0; i < 5; i += 1) {
            await mover(id, { unidade: UNIDADE_PADRAO, tipo: 'entrada', quantidade: 1 });
        }

        const primeira = await request(app)
            .get(`/produtos/${id}/movimentacoes?limite=2&pagina=1`)
            .set('Cookie', cookie);
        const segunda = await request(app)
            .get(`/produtos/${id}/movimentacoes?limite=2&pagina=2`)
            .set('Cookie', cookie);

        expect(primeira.body.movimentacoes).toHaveLength(2);
        expect(primeira.body.total).toBe(6);
        expect(primeira.body.paginas).toBe(3);

        const ids1 = primeira.body.movimentacoes.map((m) => m.id);
        const ids2 = segunda.body.movimentacoes.map((m) => m.id);
        expect(ids1.filter((umId) => ids2.includes(umId))).toEqual([]);
    });

    it('responde 400 para pagina e limite inválidos', async () => {
        for (const consulta of ['pagina=0', 'pagina=abc', 'limite=0', 'limite=101']) {
            const { status } = await request(app)
                .get(`/produtos/1/movimentacoes?${consulta}`)
                .set('Cookie', cookie);
            expect(status, consulta).toBe(400);
        }
    });

    it('responde 404 para produto que não existe', async () => {
        const { status } = await request(app)
            .get('/produtos/999999/movimentacoes')
            .set('Cookie', cookie);
        expect(status).toBe(404);
    });

    it('exige sessão, porque o histórico revela a operação da loja', async () => {
        const { status } = await request(app).get('/produtos/1/movimentacoes');
        expect(status).toBe(401);
    });
});
