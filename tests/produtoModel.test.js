// Testes unitários do model, sem passar por HTTP.
// describe, it, expect, beforeAll e afterAll vêm de globals: true no vitest.config.mjs

const { criarBancoDeTeste, contarProdutosDaCarga } = require('./helpers/bancoDeTeste');

let ProdutoModel;
let banco;

// Envolve a API de callback do model em promessa, para o teste ficar legível.
const buscar = (termo, tipo) =>
    new Promise((ok, falha) => {
        ProdutoModel.buscar(termo, tipo, (erro, linhas) => (erro ? falha(erro) : ok(linhas)));
    });

const adicionar = (produto) =>
    new Promise((ok, falha) => {
        ProdutoModel.adicionar(produto, (erro) => (erro ? falha(erro) : ok()));
    });

beforeAll(async () => {
    banco = await criarBancoDeTeste();
    ProdutoModel = require('../src/models/ProdutoModel');
});

afterAll(() => banco.limpar());

describe('ProdutoModel.listarTodos', () => {
    it('devolve todas as linhas da carga inicial', async () => {
        const linhas = await new Promise((ok, falha) => {
            ProdutoModel.listarTodos((erro, r) => (erro ? falha(erro) : ok(r)));
        });

        expect(linhas).toHaveLength(contarProdutosDaCarga());
    });
});

describe('ProdutoModel.buscar', () => {
    // Os quatro caminhos da função. Antes da correção do item P0-1, o quarto caminho
    // não existia: a consulta ficava vazia e db.all('') derrubava o processo.

    it('caminho 1: tipo nome usa LIKE com curingas dos dois lados', async () => {
        const linhas = await buscar('bota', 'nome');

        expect(linhas.length).toBeGreaterThan(0);
        for (const linha of linhas) {
            expect(linha.nome.toLowerCase()).toContain('bota');
        }
    });

    it('caminho 2: tipo categoria usa LIKE com curingas dos dois lados', async () => {
        const linhas = await buscar('huteira', 'categoria');

        expect(linhas.length).toBeGreaterThan(0);
        for (const linha of linhas) {
            expect(linha.categoria).toContain('huteira');
        }
    });

    it('caminho 3: tipo numeracao usa igualdade exata', async () => {
        const exatas = await buscar('41', 'numeracao');
        expect(exatas.length).toBeGreaterThan(0);
        for (const linha of exatas) {
            expect(linha.numeracao).toBe('41');
        }

        // Um termo parcial não deve casar, porque a comparação é exata.
        const parciais = await buscar('4', 'numeracao');
        expect(parciais).toEqual([]);
    });

    it('caminho 4: tipo inválido devolve erro de validação, e não consulta o banco', async () => {
        for (const tipo of [
            undefined,
            null,
            '',
            'cor',
            'marca',
            123,
            {},
            [],
            'constructor',
            '__proto__'
        ]) {
            await expect(buscar('x', tipo)).rejects.toMatchObject({ validacao: true });
        }
    });

    it('termo ausente ou vazio devolve erro de validação', async () => {
        for (const termo of [undefined, null, '', '   ', 42, {}]) {
            await expect(buscar(termo, 'nome')).rejects.toMatchObject({ validacao: true });
        }
    });

    it('a mensagem do erro diz qual parâmetro está errado', async () => {
        await expect(buscar('x', 'cor')).rejects.toThrow(/tipo/);
        await expect(buscar('', 'nome')).rejects.toThrow(/termo/);
    });
});

describe('ProdutoModel.adicionar', () => {
    const valido = {
        nome: 'Bota Unitaria',
        categoria: 'Bota',
        publico: 'Masculino',
        quantidade: 4,
        status_estoque: 'Em estoque',
        numeracao: '42'
    };

    it('grava um produto válido', async () => {
        await adicionar(valido);
        const linhas = await buscar('Bota Unitaria', 'nome');

        expect(linhas).toHaveLength(1);
        expect(linhas[0].quantidade).toBe(4);
    });

    it('aplica trim nos campos de texto', async () => {
        await adicionar({ ...valido, nome: '  Com Espacos  ', categoria: ' Teste ' });
        const linhas = await buscar('Com Espacos', 'nome');

        expect(linhas).toHaveLength(1);
        expect(linhas[0].nome).toBe('Com Espacos');
        expect(linhas[0].categoria).toBe('Teste');
    });

    it('rejeita campos de texto ausentes, vazios ou de outro tipo', async () => {
        const casos = [
            {},
            { ...valido, nome: undefined },
            { ...valido, nome: '' },
            { ...valido, nome: '   ' },
            { ...valido, nome: 42 },
            { ...valido, categoria: undefined },
            { ...valido, publico: undefined },
            { ...valido, publico: 'Homem' },
            { ...valido, numeracao: undefined }
        ];

        for (const caso of casos) {
            await expect(adicionar(caso)).rejects.toMatchObject({ validacao: true });
        }
    });

    it('rejeita quantidade que não é inteiro, e quantidade negativa', async () => {
        for (const quantidade of [undefined, null, 'muitos', 1.5, NaN, -1, {}]) {
            await expect(adicionar({ ...valido, quantidade })).rejects.toMatchObject({
                validacao: true
            });
        }
    });

    it('rejeita corpo que não é objeto', async () => {
        for (const corpo of [null, undefined, 'texto', 42, []]) {
            await expect(adicionar(corpo)).rejects.toMatchObject({ validacao: true });
        }
    });

    it('rejeita texto acima do limite de tamanho', async () => {
        const gigante = 'a'.repeat(201);
        await expect(adicionar({ ...valido, nome: gigante })).rejects.toMatchObject({
            validacao: true
        });
    });

    it('lista todos os erros de uma vez, e não só o primeiro', async () => {
        try {
            await adicionar({ nome: '', quantidade: 'x' });
            throw new Error('deveria ter falhado');
        } catch (erro) {
            expect(erro.validacao).toBe(true);
            expect(Array.isArray(erro.erros)).toBe(true);
            // nome, categoria, numeracao, publico e quantidade
            expect(erro.erros.length).toBeGreaterThanOrEqual(5);
        }
    });
});
