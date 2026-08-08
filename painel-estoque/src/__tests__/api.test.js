// Testes do cliente HTTP. Eles conferem o que a tela manda para a API e o que ela faz
// com a resposta.
//
// O App.test.jsx substitui este módulo inteiro por um dublê, portanto o cliente ficava
// sem teste nenhum. É justamente aqui que mora o contrato com o backend: método, caminho,
// query, credential e tradução do erro.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  listarProdutos,
  obterProduto,
  buscarProdutos,
  listarOpcoesDeFiltro,
  verificarSaude,
  adicionarProduto,
  atualizarProduto,
  removerProduto,
  obterEstoque,
  listarMovimentacoes,
  registrarMovimentacao,
  entrar,
  sair,
  obterSessao
} from '../api/produtos';

// Uma resposta de sucesso com o corpo pedido.
const responder = (corpo, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => corpo
});

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Caminho e opções da última chamada.
const ultimaChamada = () => {
  const [caminho, opcoes] = globalThis.fetch.mock.calls.at(-1);
  return { caminho, opcoes };
};

describe('toda chamada envia o cookie de sessão', () => {
  it('usa credentials include', async () => {
    globalThis.fetch.mockResolvedValue(responder({ produtos: [] }));
    await listarProdutos();

    // Sem isto, o navegador não manda o cookie httpOnly e a escrita responderia 401.
    expect(ultimaChamada().opcoes.credentials).toBe('include');
  });
});

describe('montagem do caminho', () => {
  beforeEach(() => globalThis.fetch.mockResolvedValue(responder({})));

  it('listarProdutos sem filtro não põe query', async () => {
    await listarProdutos();
    expect(ultimaChamada().caminho).toBe('/produtos');
  });

  it('listarProdutos deixa de fora o parâmetro vazio', async () => {
    // 'ordenar=' vazio faria a API responder 400.
    await listarProdutos({ publico: 'Feminino', categoria: '', ordenar: undefined, pagina: 2 });
    expect(ultimaChamada().caminho).toBe('/produtos?publico=Feminino&pagina=2');
  });

  it('escapa o id no caminho', async () => {
    await obterProduto('1/../2');
    expect(ultimaChamada().caminho).toBe('/produtos/1%2F..%2F2');
  });

  it('escapa o termo da busca', async () => {
    await buscarProdutos('nome', 'bota & sapato');
    expect(ultimaChamada().caminho).toBe('/produtos/buscar?tipo=nome&termo=bota%20%26%20sapato');
  });

  it('as rotas fixas apontam para o lugar certo', async () => {
    await listarOpcoesDeFiltro();
    expect(ultimaChamada().caminho).toBe('/produtos/categorias');

    await verificarSaude();
    expect(ultimaChamada().caminho).toBe('/health');

    await obterSessao();
    expect(ultimaChamada().caminho).toBe('/auth/sessao');
  });
});

describe('método e corpo da escrita', () => {
  beforeEach(() => globalThis.fetch.mockResolvedValue(responder({ id: 1 })));

  it('adicionarProduto manda POST com o produto em JSON', async () => {
    await adicionarProduto({ nome: 'Bota', quantidade: 2 });
    const { caminho, opcoes } = ultimaChamada();

    expect(caminho).toBe('/produtos');
    expect(opcoes.method).toBe('POST');
    expect(opcoes.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opcoes.body)).toEqual({ nome: 'Bota', quantidade: 2 });
  });

  it('atualizarProduto manda PUT', async () => {
    await atualizarProduto(7, { nome: 'Bota' });
    const { caminho, opcoes } = ultimaChamada();

    expect(caminho).toBe('/produtos/7');
    expect(opcoes.method).toBe('PUT');
  });

  it('removerProduto manda DELETE sem corpo', async () => {
    await removerProduto(7);
    const { caminho, opcoes } = ultimaChamada();

    expect(caminho).toBe('/produtos/7');
    expect(opcoes.method).toBe('DELETE');
    expect(opcoes.body).toBeUndefined();
  });

  it('entrar manda a senha no corpo, e não na query', async () => {
    await entrar('senha secreta');
    const { caminho, opcoes } = ultimaChamada();

    // Uma senha na query apareceria no log do servidor e no histórico do navegador.
    expect(caminho).toBe('/auth/login');
    expect(caminho).not.toContain('senha');
    expect(JSON.parse(opcoes.body)).toEqual({ senha: 'senha secreta' });
  });

  it('sair manda POST', async () => {
    await sair();
    expect(ultimaChamada().opcoes.method).toBe('POST');
  });
});

describe('estoque e movimentação', () => {
  beforeEach(() => globalThis.fetch.mockResolvedValue(responder({ total: 0 })));

  it('obterEstoque aponta para a rota da unidade', async () => {
    await obterEstoque(4);
    expect(ultimaChamada().caminho).toBe('/produtos/4/estoque');
  });

  it('listarMovimentacoes aceita paginação', async () => {
    await listarMovimentacoes(4, { pagina: 2, limite: 10 });
    expect(ultimaChamada().caminho).toBe('/produtos/4/movimentacoes?pagina=2&limite=10');
  });

  it('registrarMovimentacao manda POST com unidade, tipo e quantidade', async () => {
    await registrarMovimentacao(4, { unidade: 'Filial', tipo: 'saida', quantidade: 2 });
    const { caminho, opcoes } = ultimaChamada();

    expect(caminho).toBe('/produtos/4/movimentacoes');
    expect(opcoes.method).toBe('POST');
    expect(JSON.parse(opcoes.body)).toEqual({
      unidade: 'Filial',
      tipo: 'saida',
      quantidade: 2
    });
  });
});

describe('tradução da resposta de erro', () => {
  it('usa a mensagem que a API mandou', async () => {
    globalThis.fetch.mockResolvedValue(responder({ mensagem: 'Produto não encontrado.' }, 404));

    await expect(obterProduto(9)).rejects.toThrow('Produto não encontrado.');
  });

  it('carrega a lista de erros da validação', async () => {
    globalThis.fetch.mockResolvedValue(
      responder({ mensagem: 'Não passou.', erros: ['O campo "publico" é obrigatório.'] }, 400)
    );

    await expect(adicionarProduto({})).rejects.toMatchObject({
      status: 400,
      erros: ['O campo "publico" é obrigatório.']
    });
  });

  it('inventa uma mensagem quando a resposta de erro não traz nenhuma', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('sem JSON');
      }
    });

    await expect(obterProduto(1)).rejects.toMatchObject({ status: 500, erros: [] });
    await expect(obterProduto(1)).rejects.toThrow('500');
  });

  it('a falha de rede vira mensagem que a pessoa entende', async () => {
    globalThis.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    // 'Failed to fetch' não diz nada a quem usa o painel.
    await expect(listarProdutos()).rejects.toThrow('Confira se ele está no ar');
  });

  it('o sucesso sem JSON no corpo não quebra', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('sem corpo');
      }
    });

    await expect(sair()).resolves.toBeNull();
  });
});
