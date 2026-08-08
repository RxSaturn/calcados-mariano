import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Painel from '../Painel';
import * as api from '../../api/produtos';

vi.mock('../../api/produtos');

const envelope = (produtos) => ({
  produtos,
  total: produtos.length,
  pagina: 1,
  limite: 50,
  paginas: 1
});

/** Erro no formato que o cliente HTTP monta: mensagem mais o status. */
function falhaComStatus(status, mensagem) {
  const erro = new Error(mensagem);
  erro.status = status;
  erro.erros = [];
  return erro;
}

beforeEach(() => {
  vi.resetAllMocks();
  api.listarProdutos.mockResolvedValue(envelope([]));
});

describe('entrada do painel', () => {
  it('sem sessão, pede a senha em vez de mostrar o painel', async () => {
    api.obterSessao.mockResolvedValue({ autenticado: false });
    render(<Painel />);

    expect(await screen.findByLabelText('Senha')).toBeInTheDocument();
    expect(screen.queryByText('Estoque baixo')).not.toBeInTheDocument();
  });

  it('com sessão, mostra o painel direto', async () => {
    api.obterSessao.mockResolvedValue({ autenticado: true });
    render(<Painel />);

    expect(await screen.findByText('Estoque baixo')).toBeInTheDocument();
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument();
  });

  it('a sessão que falha na consulta cai no login, e não numa tela quebrada', async () => {
    api.obterSessao.mockRejectedValue(new Error('servidor fora'));
    render(<Painel />);

    expect(await screen.findByLabelText('Senha')).toBeInTheDocument();
  });

  it('senha certa abre o painel', async () => {
    api.obterSessao.mockResolvedValue({ autenticado: false });
    api.entrar.mockResolvedValue({ autenticado: true });
    render(<Painel />);

    await userEvent.type(await screen.findByLabelText('Senha'), 'senhaDaLoja2026');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Estoque baixo')).toBeInTheDocument();
    expect(api.entrar).toHaveBeenCalledWith('senhaDaLoja2026');
  });

  it('401 diz que a senha está errada', async () => {
    api.obterSessao.mockResolvedValue({ autenticado: false });
    api.entrar.mockRejectedValue(falhaComStatus(401, 'Senha incorreta.'));
    render(<Painel />);

    await userEvent.type(await screen.findByLabelText('Senha'), 'chutei');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Senha incorreta/i);
  });

  it('503 diz que o sistema não foi configurado, e não que a senha está errada', async () => {
    // As duas situações se parecem na tela e não são a mesma coisa. Com a
    // mensagem de senha, o dono da loja tentaria outra e outra, quando o
    // problema está na instalação e ele não resolve dali.
    api.obterSessao.mockResolvedValue({ autenticado: false });
    api.entrar.mockRejectedValue(
      falhaComStatus(503, 'A autenticação não está configurada neste servidor.')
    );
    render(<Painel />);

    await userEvent.type(await screen.findByLabelText('Senha'), 'qualquerSenha1');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent(/não foi configurado com uma senha/i);
    expect(aviso).not.toHaveTextContent(/Senha incorreta/i);
  });

  it('sair volta ao login', async () => {
    api.obterSessao.mockResolvedValue({ autenticado: true });
    api.sair.mockResolvedValue({});
    render(<Painel />);

    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByLabelText('Senha')).toBeInTheDocument();
    expect(api.sair).toHaveBeenCalled();
  });

  it('sair volta ao login mesmo se a chamada falhar', async () => {
    // Quem clicou em sair quer sair. Deixar o painel aberto porque o
    // servidor não respondeu seria o oposto do pedido, e numa máquina de
    // loja isso é a tela ficando aberta para quem passar.
    api.obterSessao.mockResolvedValue({ autenticado: true });
    api.sair.mockRejectedValue(new Error('servidor fora'));
    render(<Painel />);

    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByLabelText('Senha')).toBeInTheDocument();
  });

  it('sessão vencida no meio do uso devolve ao login', async () => {
    // A sessão dura oito horas e vence no meio do expediente. Mostrar "erro
    // ao cadastrar" faria o dono repetir o cadastro achando que o produto
    // tem problema, quando o que acabou foi a sessão.
    api.obterSessao.mockResolvedValue({ autenticado: true });
    api.listarProdutos
      .mockResolvedValueOnce(envelope([]))
      .mockRejectedValue(falhaComStatus(401, 'Sessão expirada.'));
    api.adicionarProduto.mockRejectedValue(falhaComStatus(401, 'Sessão expirada.'));

    render(<Painel />);
    await screen.findByText('Estoque baixo');

    await userEvent.type(screen.getByLabelText(/Nome/i), 'Bota Nova');
    await userEvent.type(screen.getByLabelText(/Categoria/i), 'Bota');
    await userEvent.type(screen.getByLabelText(/Numeração/i), '41');
    await userEvent.type(screen.getByLabelText(/Quantidade/i), '3');
    await userEvent.click(screen.getByRole('button', { name: /Cadastrar/i }));

    await waitFor(() => expect(screen.getByLabelText('Senha')).toBeInTheDocument());
  });

  it('o botão de entrar fica desabilitado com a senha vazia', async () => {
    api.obterSessao.mockResolvedValue({ autenticado: false });
    render(<Painel />);

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeDisabled();
  });
});
