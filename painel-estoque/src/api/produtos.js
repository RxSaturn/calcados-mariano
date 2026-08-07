import { URL_API } from '../config';

// Cliente HTTP da API de estoque. Antes deste arquivo, a interface não fazia nenhuma
// chamada: os produtos vinham de uma lista fixa no código.

// Lê a resposta e transforma um status de erro em exceção com mensagem útil.
// A API devolve { mensagem } em 400 e 500, e { mensagem, erros } quando a validação falha.
const lerResposta = async (resposta) => {
  let corpo;
  try {
    corpo = await resposta.json();
  } catch {
    // Uma resposta sem JSON no corpo não é motivo para quebrar aqui.
    corpo = null;
  }

  if (resposta.ok) return corpo;

  const erro = new Error(corpo?.mensagem || `A API respondeu ${resposta.status}.`);
  erro.status = resposta.status;
  erro.erros = corpo?.erros || [];
  throw erro;
};

// Converte falha de rede em uma mensagem que o usuário entende.
const chamar = async (caminho, opcoes) => {
  let resposta;
  try {
    resposta = await fetch(`${URL_API}${caminho}`, opcoes);
  } catch {
    throw new Error('Não foi possível falar com o servidor. Confira se ele está no ar.');
  }
  return lerResposta(resposta);
};

export const listarProdutos = () => chamar('/produtos');

export const buscarProdutos = (tipo, termo) =>
  chamar(`/produtos/buscar?tipo=${encodeURIComponent(tipo)}&termo=${encodeURIComponent(termo)}`);

export const adicionarProduto = (produto) =>
  chamar('/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(produto)
  });

export const verificarSaude = () => chamar('/health');
