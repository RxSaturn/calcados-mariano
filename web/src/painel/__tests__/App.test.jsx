import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../Painel';
import * as api from '../../api/produtos';

// O módulo da API é substituído por mocks. Estes testes conferem a tela, e não a API.
// A API tem os seus próprios testes de integração em tests/produtos.test.js, na raiz.
vi.mock('../../api/produtos');

const PRODUTOS = [
  {
    id: 1,
    nome: 'Bota Texana',
    categoria: 'Bota',
    numeracao: '41',
    quantidade: 8, // no limite de estoque baixo (padrão 10)
    status_estoque: 'Em estoque'
  },
  {
    id: 2,
    nome: 'Tênis Casual',
    categoria: 'Tênis',
    numeracao: '38',
    quantidade: 20, // confortável
    status_estoque: 'Em estoque'
  }
];

// A API devolve o envelope da listagem, e não um array cru, porque a tela precisa do
// total para montar a paginação. Este helper monta um envelope de teste, para o formato
// ficar em um lugar só.
const envelope = (produtos) => ({
  produtos,
  total: produtos.length,
  pagina: 1,
  limite: 50,
  paginas: produtos.length === 0 ? 0 : 1
});

beforeEach(() => {
  vi.resetAllMocks();
  api.listarProdutos.mockResolvedValue(envelope(PRODUTOS));
});

describe('App', () => {
  it('renderiza sem lançar erro e mostra o nome da loja', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /Calçados Mariano/i })).toBeInTheDocument();
  });

  it('carrega o estoque da API e mostra uma linha por produto', async () => {
    render(<App />);

    await screen.findByText('Bota Texana');
    expect(screen.getByText('Tênis Casual')).toBeInTheDocument();
    expect(api.listarProdutos).toHaveBeenCalledTimes(1);

    const linhas = screen.getAllByRole('row');
    // Uma linha de cabeçalho e duas de produto.
    expect(linhas).toHaveLength(3);
  });

  it('mostra as colunas de estoque, e não preço nem imagem', async () => {
    render(<App />);
    await screen.findByText('Bota Texana');

    for (const coluna of ['Nome', 'Categoria', 'Numeração', 'Quantidade', 'Situação']) {
      expect(screen.getByRole('columnheader', { name: coluna })).toBeInTheDocument();
    }
    expect(screen.queryByText(/pre[çc]o/i)).not.toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('destaca a linha com estoque baixo e conta no resumo', async () => {
    render(<App />);
    const linhaBaixa = (await screen.findByText('Bota Texana')).closest('tr');
    const linhaAlta = screen.getByText('Tênis Casual').closest('tr');

    expect(linhaBaixa).toHaveClass('linha-estoque-baixo');
    expect(linhaAlta).not.toHaveClass('linha-estoque-baixo');
    expect(within(linhaBaixa).getByText('baixo')).toBeInTheDocument();

    // O resumo mostra 2 produtos e 1 com estoque baixo.
    expect(screen.getByText('Produtos').nextSibling).toHaveTextContent('2');
    expect(screen.getByText('Estoque baixo').nextSibling).toHaveTextContent('1');
  });

  it('mostra a mensagem de erro quando a API falha, e permite tentar de novo', async () => {
    api.listarProdutos.mockRejectedValueOnce(new Error('Servidor fora do ar.'));
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor fora do ar.');

    api.listarProdutos.mockResolvedValue(envelope(PRODUTOS));
    await userEvent.click(screen.getByRole('button', { name: /Tentar de novo/i }));

    expect(await screen.findByText('Bota Texana')).toBeInTheDocument();
  });

  it('mostra aviso quando a lista vem vazia', async () => {
    api.listarProdutos.mockResolvedValue(envelope([]));
    render(<App />);

    expect(await screen.findByText(/Nenhum produto encontrado/i)).toBeInTheDocument();
  });
});

describe('busca', () => {
  it('chama a API com o tipo e o termo escolhidos', async () => {
    api.buscarProdutos.mockResolvedValue([PRODUTOS[0]]);
    render(<App />);
    await screen.findByText('Bota Texana');

    await userEvent.selectOptions(screen.getByLabelText(/Buscar por/i), 'numeracao');
    await userEvent.type(screen.getByLabelText(/Termo/i), '41');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => expect(api.buscarProdutos).toHaveBeenCalledWith('numeracao', '41'));
    expect(screen.queryByText('Tênis Casual')).not.toBeInTheDocument();
    expect(screen.getByText(/Filtrando por numeracao/i)).toBeInTheDocument();
  });

  it('o botão de buscar fica desabilitado com o termo vazio', async () => {
    render(<App />);
    await screen.findByText('Bota Texana');

    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
  });

  it('mostrar tudo recarrega a lista completa', async () => {
    api.buscarProdutos.mockResolvedValue([PRODUTOS[0]]);
    render(<App />);
    await screen.findByText('Bota Texana');

    await userEvent.type(screen.getByLabelText(/Termo/i), 'bota');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await waitFor(() => expect(screen.queryByText('Tênis Casual')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /Mostrar tudo/i }));
    expect(await screen.findByText('Tênis Casual')).toBeInTheDocument();
  });
});

describe('cadastro', () => {
  const preencher = async () => {
    await userEvent.type(screen.getByLabelText('Nome'), 'Bota Nova');
    await userEvent.type(screen.getByLabelText('Categoria'), 'Bota');
    await userEvent.selectOptions(screen.getByLabelText('Público'), 'Feminino');
    await userEvent.type(screen.getByLabelText('Numeração'), '42');
    await userEvent.type(screen.getByLabelText('Quantidade'), '5');
  };

  it('envia o produto e converte quantidade para número', async () => {
    api.adicionarProduto.mockResolvedValue({ mensagem: 'ok' });
    render(<App />);
    await screen.findByText('Bota Texana');

    await preencher();
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() =>
      expect(api.adicionarProduto).toHaveBeenCalledWith({
        nome: 'Bota Nova',
        categoria: 'Bota',
        publico: 'Feminino',
        numeracao: '42',
        quantidade: 5, // número, e não o texto '5'
        status_estoque: 'Em estoque'
      })
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Produto cadastrado.');
  });

  it('recarrega a lista depois de cadastrar', async () => {
    api.adicionarProduto.mockResolvedValue({ mensagem: 'ok' });
    render(<App />);
    await screen.findByText('Bota Texana');

    await preencher();
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    // Uma chamada na carga inicial, outra depois do cadastro.
    await waitFor(() => expect(api.listarProdutos).toHaveBeenCalledTimes(2));
  });

  it('mostra cada erro de validação que a API devolve', async () => {
    const falha = new Error('O produto enviado não passou na validação.');
    falha.status = 400;
    falha.erros = [
      'O campo "nome" é obrigatório e precisa ser um texto.',
      'O campo "quantidade" é obrigatório e precisa ser um número inteiro.'
    ];
    api.adicionarProduto.mockRejectedValue(falha);

    render(<App />);
    await screen.findByText('Bota Texana');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    const alerta = await screen.findByRole('alert');
    expect(within(alerta).getByText(/campo "nome"/i)).toBeInTheDocument();
    expect(within(alerta).getByText(/campo "quantidade"/i)).toBeInTheDocument();
  });
});
