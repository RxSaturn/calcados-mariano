// Testes das rotas novas: listagem com filtro e paginação, um produto pelo id,
// opções de filtro, atualizar e remover.
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
const TOTAL = contarProdutosDaCarga();

const PRODUTO_VALIDO = {
    nome: 'Bota Nova de Teste',
    categoria: 'Bota',
    publico: 'Masculino',
    numeracao: '43',
    quantidade: 6,
    marca: 'Zebu',
    cor: 'Marrom',
    descricao: 'Bota de teste, para os casos de escrita.',
    imagem_url: '/imagens/bota.jpg'
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
        .send({ ...PRODUTO_VALIDO, ...extra });

// Corpo aceito pelo PUT. Ele não leva quantidade, porque o saldo muda só por
// movimentação. Ver COLUNAS_EDITAVEIS em src/models/ProdutoModel.js.
const paraEditar = (extra = {}) => {
    const corpo = { ...PRODUTO_VALIDO, ...extra };
    delete corpo.quantidade;
    return corpo;
};

describe('GET /produtos', () => {
    it('devolve um envelope com produtos, total, pagina, limite e paginas', async () => {
        const { status, body } = await request(app).get('/produtos');

        expect(status).toBe(200);
        expect(Array.isArray(body.produtos)).toBe(true);
        expect(body.total).toBeGreaterThanOrEqual(TOTAL);
        expect(body.pagina).toBe(1);
        expect(body.limite).toBe(50);
        expect(body.paginas).toBe(1);
    });

    it('ordena por nome quando ordenar não vem', async () => {
        const { body } = await request(app).get('/produtos');
        const nomes = body.produtos.map((p) => p.nome);
        const ordenados = [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));

        expect(nomes).toEqual(ordenados);
    });

    it('filtra por publico com igualdade exata', async () => {
        const { body } = await request(app).get('/produtos?publico=Feminino');

        expect(body.produtos.length).toBeGreaterThan(0);
        for (const p of body.produtos) {
            expect(p.publico).toBe('Feminino');
        }
        expect(body.total).toBe(body.produtos.length);
    });

    it('filtra por categoria com igualdade exata', async () => {
        const { body } = await request(app).get('/produtos?categoria=Sandália');

        expect(body.produtos.length).toBeGreaterThan(0);
        for (const p of body.produtos) {
            expect(p.categoria).toBe('Sandália');
        }
    });

    it('combina os dois filtros', async () => {
        const { body } = await request(app).get('/produtos?publico=Feminino&categoria=Sandália');

        for (const p of body.produtos) {
            expect(p.publico).toBe('Feminino');
            expect(p.categoria).toBe('Sandália');
        }
    });

    it('ordena por quantidade nos dois sentidos', async () => {
        const subindo = await request(app).get('/produtos?ordenar=quantidade');
        const descendo = await request(app).get('/produtos?ordenar=quantidade_desc');

        const q1 = subindo.body.produtos.map((p) => p.quantidade);
        const q2 = descendo.body.produtos.map((p) => p.quantidade);

        expect(q1).toEqual([...q1].sort((a, b) => a - b));
        expect(q2).toEqual([...q2].sort((a, b) => b - a));
    });

    it('pagina, e a soma das páginas cobre o total sem repetir', async () => {
        const primeira = await request(app).get('/produtos?limite=5&pagina=1');
        const segunda = await request(app).get('/produtos?limite=5&pagina=2');

        expect(primeira.body.produtos).toHaveLength(5);
        expect(primeira.body.limite).toBe(5);
        expect(primeira.body.paginas).toBe(Math.ceil(primeira.body.total / 5));

        const ids1 = primeira.body.produtos.map((p) => p.id);
        const ids2 = segunda.body.produtos.map((p) => p.id);
        expect(ids1.filter((id) => ids2.includes(id))).toEqual([]);
    });

    it('página além do fim devolve lista vazia, e não erro', async () => {
        const { status, body } = await request(app).get('/produtos?pagina=999&limite=10');

        expect(status).toBe(200);
        expect(body.produtos).toEqual([]);
        expect(body.total).toBeGreaterThan(0);
    });

    it('responde 400 para ordenar fora da lista, em vez de cair no padrão calado', async () => {
        const { status, body } = await request(app).get('/produtos?ordenar=preco');

        expect(status).toBe(400);
        expect(body.erros.join(' ')).toContain('ordenar');
    });

    it('responde 400 para publico fora da lista', async () => {
        const { status, body } = await request(app).get('/produtos?publico=Homem');

        expect(status).toBe(400);
        expect(body.erros.join(' ')).toContain('publico');
    });

    it('responde 400 para pagina e limite inválidos', async () => {
        for (const consulta of [
            'pagina=0',
            'pagina=-1',
            'pagina=abc',
            'pagina=1.5',
            'limite=0',
            'limite=abc',
            'limite=101'
        ]) {
            const { status } = await request(app).get(`/produtos?${consulta}`);
            expect(status, consulta).toBe(400);
        }
    });

    it('não aceita injeção pelo parâmetro ordenar', async () => {
        const { status } = await request(app).get('/produtos?ordenar=nome;DROP TABLE produtos');
        expect(status).toBe(400);

        // A tabela continua lá.
        const depois = await request(app).get('/produtos');
        expect(depois.status).toBe(200);
    });
});

describe('GET /produtos/categorias', () => {
    it('devolve as categorias e os públicos que existem no banco', async () => {
        const { status, body } = await request(app).get('/produtos/categorias');

        expect(status).toBe(200);
        expect(Array.isArray(body.categorias)).toBe(true);
        expect(Array.isArray(body.publicos)).toBe(true);
        expect(body.publicos).toContain('Feminino');
        expect(body.publicos).toContain('Masculino');
        expect(body.categorias.length).toBeGreaterThan(1);
    });

    it('não é tratada como um id', async () => {
        // Se '/produtos/:id' vier antes no arquivo de rotas, o Express casa 'categorias'
        // como id e este pedido devolve 400.
        const { body } = await request(app).get('/produtos/categorias');
        expect(body.categorias).toBeDefined();
    });

    it('não repete valor', async () => {
        const { body } = await request(app).get('/produtos/categorias');
        expect(new Set(body.categorias).size).toBe(body.categorias.length);
        expect(new Set(body.publicos).size).toBe(body.publicos.length);
    });
});

describe('GET /produtos/:id', () => {
    it('devolve o produto pedido', async () => {
        const { status, body } = await request(app).get('/produtos/1');

        expect(status).toBe(200);
        expect(body.id).toBe(1);
        expect(body.nome).toBeTruthy();
        expect(body.publico).toBeTruthy();
    });

    it('responde 404 para id que não existe', async () => {
        const { status, body } = await request(app).get('/produtos/999999');

        expect(status).toBe(404);
        expect(body.mensagem).toContain('não encontrado');
    });

    it('responde 400 para id que não é inteiro positivo', async () => {
        for (const id of ['0', '-1', 'abc', '1.5', '1x']) {
            const { status } = await request(app).get(`/produtos/${id}`);
            expect(status, id).toBe(400);
        }
    });

    it('a rota de busca não é tratada como id', async () => {
        const { status } = await request(app).get('/produtos/buscar?tipo=nome&termo=bota');
        expect(status).toBe(200);
    });
});

describe('POST /produtos cobre as colunas todas', () => {
    it('grava publico, marca, cor, descricao e imagem_url', async () => {
        const criacao = await criar({ nome: 'Bota Colunas Completas' });
        expect(criacao.status).toBe(201);
        expect(criacao.body.id).toBeGreaterThan(0);

        const { body } = await request(app).get(`/produtos/${criacao.body.id}`);

        expect(body.publico).toBe('Masculino');
        expect(body.marca).toBe('Zebu');
        expect(body.cor).toBe('Marrom');
        expect(body.descricao).toContain('Bota de teste');
        expect(body.imagem_url).toBe('/imagens/bota.jpg');
    });

    it('o produto criado aparece no filtro de publico', async () => {
        // Este é o defeito que a fase anterior abriu: com publico nulo, o produto
        // ficava invisível na vitrine e o dono da loja não tinha como perceber.
        const criacao = await criar({ nome: 'Sandalia Visivel', publico: 'Feminino' });
        expect(criacao.status).toBe(201);

        const { body } = await request(app).get('/produtos?publico=Feminino&limite=100');
        expect(body.produtos.map((p) => p.nome)).toContain('Sandalia Visivel');
    });

    it('exige publico e recusa valor fora da lista', async () => {
        for (const publico of [undefined, null, '', 'Homem', 'masculino', 123]) {
            const resposta = await criar({ nome: 'Sem Publico', publico });
            expect(resposta.status, String(publico)).toBe(400);
            expect(resposta.body.erros.join(' ')).toContain('publico');
        }
    });

    it('deriva o status_estoque da quantidade quando ele não vem', async () => {
        const comEstoque = await criar({ nome: 'Com Estoque', quantidade: 5 });
        const semEstoque = await criar({ nome: 'Sem Estoque', quantidade: 0 });

        const a = await request(app).get(`/produtos/${comEstoque.body.id}`);
        const b = await request(app).get(`/produtos/${semEstoque.body.id}`);

        expect(a.body.status_estoque).toBe('Em estoque');
        expect(b.body.status_estoque).toBe('Sem estoque');
    });

    it('respeita o status_estoque quando o cliente manda um', async () => {
        const criacao = await criar({ nome: 'Status Proprio', status_estoque: 'Encomenda' });
        const { body } = await request(app).get(`/produtos/${criacao.body.id}`);

        expect(body.status_estoque).toBe('Encomenda');
    });

    it('recusa imagem_url com esquema perigoso', async () => {
        // A vitrine põe este valor no src de uma imagem. Um 'javascript:' viraria XSS.
        for (const url of [
            'javascript:alert(1)',
            'data:text/html,<script>',
            'ftp://x/y',
            'imagens/a.jpg'
        ]) {
            const resposta = await criar({ nome: 'Imagem Ruim', imagem_url: url });
            expect(resposta.status, url).toBe(400);
            expect(resposta.body.erros.join(' ')).toContain('imagem_url');
        }
    });

    it('aceita imagem_url relativa e http e https', async () => {
        for (const url of ['/a.jpg', 'http://x.com/a.jpg', 'https://x.com/a.jpg']) {
            const resposta = await criar({ nome: `Imagem ${url}`, imagem_url: url });
            expect(resposta.status, url).toBe(201);
        }
    });

    it('trata campo opcional vazio como nulo', async () => {
        const criacao = await criar({
            nome: 'Sem Opcionais',
            marca: '',
            cor: undefined,
            descricao: ''
        });
        const { body } = await request(app).get(`/produtos/${criacao.body.id}`);

        expect(body.marca).toBeNull();
        expect(body.cor).toBeNull();
        expect(body.descricao).toBeNull();
    });
});

describe('PUT /produtos/:id', () => {
    it('substitui os atributos e devolve 200', async () => {
        const criacao = await criar({ nome: 'Antes do PUT' });

        const alteracao = await request(app)
            .put(`/produtos/${criacao.body.id}`)
            .set('Cookie', cookie)
            .send(paraEditar({ nome: 'Depois do PUT', cor: 'Azul' }));

        expect(alteracao.status).toBe(200);

        const { body } = await request(app).get(`/produtos/${criacao.body.id}`);
        expect(body.nome).toBe('Depois do PUT');
        expect(body.cor).toBe('Azul');
    });

    it('não altera a quantidade, e recusa um corpo que traga o campo', async () => {
        // O saldo só muda por movimentação. Aceitar o campo e ignorá-lo daria um 200
        // que faria a pessoa acreditar que o estoque mudou.
        const criacao = await criar({ nome: 'Saldo Intocado', quantidade: 7 });

        for (const campo of [{ quantidade: 99 }, { status_estoque: 'Esgotado' }]) {
            const resposta = await request(app)
                .put(`/produtos/${criacao.body.id}`)
                .set('Cookie', cookie)
                // O campo entra depois de paraEditar, que é justamente quem o tira.
                .send({ ...paraEditar({ nome: 'Saldo Intocado' }), ...campo });

            expect(resposta.status, JSON.stringify(campo)).toBe(400);
            expect(resposta.body.erros.join(' ')).toContain('movimentacoes');
        }

        const { body } = await request(app).get(`/produtos/${criacao.body.id}`);
        expect(body.quantidade).toBe(7);
    });

    it('a edição não mexe no saldo por unidade', async () => {
        const criacao = await criar({ nome: 'Edicao Sem Saldo', quantidade: 4 });
        const id = criacao.body.id;

        await request(app)
            .put(`/produtos/${id}`)
            .set('Cookie', cookie)
            .send(paraEditar({ nome: 'Edicao Sem Saldo', cor: 'Verde' }));

        const { body } = await request(app).get(`/produtos/${id}/estoque`).set('Cookie', cookie);
        expect(body.total).toBe(4);
    });

    it('limpa o campo opcional que não vem no corpo, porque PUT substitui', async () => {
        const criacao = await criar({ nome: 'Com Marca', marca: 'Nike' });

        const semMarca = paraEditar({ nome: 'Com Marca' });
        delete semMarca.marca;
        await request(app).put(`/produtos/${criacao.body.id}`).set('Cookie', cookie).send(semMarca);

        const { body } = await request(app).get(`/produtos/${criacao.body.id}`);
        expect(body.marca).toBeNull();
    });

    it('responde 404 para id que não existe', async () => {
        const resposta = await request(app)
            .put('/produtos/999999')
            .set('Cookie', cookie)
            .send(paraEditar());

        expect(resposta.status).toBe(404);
    });

    it('responde 400 para id inválido e para corpo inválido', async () => {
        const idRuim = await request(app)
            .put('/produtos/abc')
            .set('Cookie', cookie)
            .send(paraEditar());
        expect(idRuim.status).toBe(400);

        const corpoRuim = await request(app).put('/produtos/1').set('Cookie', cookie).send({});
        expect(corpoRuim.status).toBe(400);
    });
});

describe('DELETE /produtos/:id', () => {
    it('remove o produto e devolve 200', async () => {
        const criacao = await criar({ nome: 'Para Remover' });

        const remocao = await request(app)
            .delete(`/produtos/${criacao.body.id}`)
            .set('Cookie', cookie);

        expect(remocao.status).toBe(200);
        expect((await request(app).get(`/produtos/${criacao.body.id}`)).status).toBe(404);
    });

    it('responde 404 na segunda remoção do mesmo id', async () => {
        const criacao = await criar({ nome: 'Remover Duas Vezes' });

        await request(app).delete(`/produtos/${criacao.body.id}`).set('Cookie', cookie);
        const segunda = await request(app)
            .delete(`/produtos/${criacao.body.id}`)
            .set('Cookie', cookie);

        expect(segunda.status).toBe(404);
    });

    it('responde 400 para id inválido, e não apaga nada', async () => {
        const antes = await request(app).get('/produtos?limite=100');

        const resposta = await request(app).delete('/produtos/abc').set('Cookie', cookie);
        expect(resposta.status).toBe(400);

        const depois = await request(app).get('/produtos?limite=100');
        expect(depois.body.total).toBe(antes.body.total);
    });
});
