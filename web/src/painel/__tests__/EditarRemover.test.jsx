import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Painel from '../Painel';
import * as api from '../../api/produtos';

vi.mock('../../api/produtos');

const PRODUTO = {
  id: 7,
  nome: 'Bota Texana',
  categoria: 'Bota',
  publico: 'Masculino',
  numeracao: '41',
  quantidade: 8,
  status_estoque: 'Em estoque'
};

const envelope = (produtos) => ({
  produtos,
  total: produtos.length,
  pagina: 1,
  limite: 50,
  paginas: 1
});

function falhaComStatus(status, mensagem) {
  const erro = new Error(mensagem);
  erro.status = status;
  erro.erros = [];
  return erro;
}

/**
 * A linha da tabela daquele produto, para as ações não serem procuradas na tela
 * toda. É assíncrona porque a lista vem da API: procurar antes de ela chegar
 * falharia por tempo, e não por defeito.
 */
const linhaDe = (nome) => screen.findByRole('row', { name: new RegExp(nome) });

beforeEach(() => {
  vi.resetAllMocks();
  api.obterSessao.mockResolvedValue({ autenticado: true });
  api.listarProdutos.mockResolvedValue(envelope([PRODUTO]));
});

describe('editar', () => {
  it('abre o formulário já preenchido com o que está no banco', async () => {
    render(<Painel />);
    await userEvent.click(
      within(await linhaDe('Bota Texana')).getByRole('button', { name: 'Editar' })
    );

    // Vazio, quem editasse reescreveria tudo — inclusive o que não queria mudar.
    expect(await screen.findByText(/Editar Bota Texana/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/i)).toHaveValue('Bota Texana');
    expect(screen.getByLabelText(/Quantidade/i)).toHaveValue(8);
  });

  it('salva chamando a API com o id e o produto inteiro', async () => {
    api.atualizarProduto.mockResolvedValue({});
    render(<Painel />);
    await userEvent.click(
      within(await linhaDe('Bota Texana')).getByRole('button', { name: 'Editar' })
    );

    const quantidade = await screen.findByLabelText(/Quantidade/i);
    await userEvent.clear(quantidade);
    await userEvent.type(quantidade, '12');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(api.atualizarProduto).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ nome: 'Bota Texana', quantidade: 12 })
      )
    );
  });

  it('cancelar volta ao cadastro sem tocar na API', async () => {
    render(<Painel />);
    await userEvent.click(
      within(await linhaDe('Bota Texana')).getByRole('button', { name: 'Editar' })
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText('Cadastrar produto')).toBeInTheDocument();
    expect(api.atualizarProduto).not.toHaveBeenCalled();
  });

  it('mostra os erros de validação que a API devolve', async () => {
    api.atualizarProduto.mockRejectedValue({
      ...falhaComStatus(400, 'Dados inválidos.'),
      erros: ['O campo "numeracao" é obrigatório.']
    });
    render(<Painel />);
    await userEvent.click(
      within(await linhaDe('Bota Texana')).getByRole('button', { name: 'Editar' })
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText(/"numeracao" é obrigatório/)).toBeInTheDocument();
  });
});

describe('remover', () => {
  it('pede confirmação antes, e não apaga no primeiro clique', async () => {
    render(<Painel />);
    await userEvent.click(
      within(await linhaDe('Bota Texana')).getByRole('button', { name: 'Remover' })
    );

    expect(await screen.findByText('Remover?')).toBeInTheDocument();
    expect(api.removerProduto).not.toHaveBeenCalled();
  });

  it('remove depois de confirmar', async () => {
    api.removerProduto.mockResolvedValue({});
    api.listarProdutos.mockResolvedValueOnce(envelope([PRODUTO])).mockResolvedValue(envelope([]));
    render(<Painel />);

    await userEvent.click(
      within(await linhaDe('Bota Texana')).getByRole('button', { name: 'Remover' })
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Sim, remover' }));

    await waitFor(() => expect(api.removerProduto).toHaveBeenCalledWith(7));
    expect(await screen.findByText('Nenhum produto encontrado.')).toBeInTheDocument();
  });

  it('o "Não" desiste e devolve os botões de sempre', async () => {
    render(<Painel />);
    await userEvent.click(
      within(await linhaDe('Bota Texana')).getByRole('button', { name: 'Remover' })
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Não' }));

    expect(
      within(await linhaDe('Bota Texana')).getByRole('button', { name: 'Editar' })
    ).toBeInTheDocument();
    expect(api.removerProduto).not.toHaveBeenCalled();
  });

  it('remover o produto aberto para edição fecha o formulário', async () => {
    // Salvar depois disso daria 404, e a mensagem não diria que o produto já
    // não existe.
    api.removerProduto.mockResolvedValue({});
    api.listarProdutos.mockResolvedValueOnce(envelope([PRODUTO])).mockResolvedValue(envelope([]));
    render(<Painel />);

    await userEvent.click(
      within(await linhaDe('Bota Texana')).getByRole('button', { name: 'Editar' })
    );
    expect(await screen.findByText(/Editar Bota Texana/)).toBeInTheDocument();

    await userEvent.click(
      within(await linhaDe('Bota Texana')).getByRole('button', { name: 'Remover' })
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Sim, remover' }));

    expect(await screen.findByText('Cadastrar produto')).toBeInTheDocument();
  });

  it('a sessão vencida ao remover devolve ao login', async () => {
    api.removerProduto.mockRejectedValue(falhaComStatus(401, 'Sessão expirada.'));
    render(<Painel />);

    await userEvent.click(
      within(await linhaDe('Bota Texana')).getByRole('button', { name: 'Remover' })
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Sim, remover' }));

    expect(await screen.findByLabelText('Senha')).toBeInTheDocument();
  });
});
