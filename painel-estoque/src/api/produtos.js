import { URL_API } from '../config';

// Cliente HTTP da API de estoque. Antes deste arquivo, a interface não fazia nenhuma
// chamada: os produtos vinham de uma lista fixa no código.

// Lê a resposta e transforma um status de erro em exceção com mensagem útil.
// A API devolve { mensagem } em 400, 401, 404 e 500, e { mensagem, erros } quando a
// validação falha.
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
const chamar = async (caminho, opcoes = {}) => {
  let resposta;
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      ...opcoes,
      // A sessão do painel viaja em cookie httpOnly. Sem credentials, o navegador não
      // envia esse cookie e as rotas de escrita responderiam 401.
      credentials: 'include'
    });
  } catch {
    throw new Error('Não foi possível falar com o servidor. Confira se ele está no ar.');
  }
  return lerResposta(resposta);
};

const comCorpo = (metodo, corpo) => ({
  method: metodo,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo)
});

// Monta a query só com os parâmetros que têm valor. Mandar 'ordenar=' vazio faria a API
// responder 400.
const montarQuery = (parametros) => {
  const query = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') query.set(chave, valor);
  }
  const texto = query.toString();
  return texto === '' ? '' : `?${texto}`;
};

// ---- Leitura. Pública. ----

// Devolve o envelope { produtos, total, pagina, limite, paginas }, e não um array cru,
// porque a tela precisa do total para montar a paginação.
export const listarProdutos = (filtros = {}) => chamar(`/produtos${montarQuery(filtros)}`);

export const obterProduto = (id) => chamar(`/produtos/${encodeURIComponent(id)}`);

export const buscarProdutos = (tipo, termo) =>
  chamar(`/produtos/buscar?tipo=${encodeURIComponent(tipo)}&termo=${encodeURIComponent(termo)}`);

// Categorias e públicos que existem no banco. A tela monta o filtro com isto, em vez de
// repetir uma lista fixa que sai de sincronia com os dados.
export const listarOpcoesDeFiltro = () => chamar('/produtos/categorias');

export const verificarSaude = () => chamar('/health');

// ---- Escrita. Exige sessão. ----

export const adicionarProduto = (produto) => chamar('/produtos', comCorpo('POST', produto));

export const atualizarProduto = (id, produto) =>
  chamar(`/produtos/${encodeURIComponent(id)}`, comCorpo('PUT', produto));

export const removerProduto = (id) =>
  chamar(`/produtos/${encodeURIComponent(id)}`, { method: 'DELETE' });

// ---- Sessão ----

export const entrar = (senha) => chamar('/auth/login', comCorpo('POST', { senha }));

export const sair = () => chamar('/auth/logout', { method: 'POST' });

export const obterSessao = () => chamar('/auth/sessao');
