import { useEffect, useState } from 'react';

import { buscarProdutos, listarOpcoesDeFiltro, listarProdutos } from '../api/produtos';
import { LOJA, ORDENACOES, WHATSAPP } from '../config';
import SemImagem from './SemImagem';
import './vitrine.css';

/**
 * Vitrine pública da loja.
 *
 * Ela existe para uma coisa só: o cliente vê o calçado e puxa conversa no
 * WhatsApp. Não vende, não cobra e não guarda dado de ninguém — e por isso a
 * tela não pode dizer que faz nada disso.
 *
 * O filtro, a ordenação e a busca são feitos pela API. Antes eram feitos no
 * navegador, com heurística sobre o texto da categoria (`includes('esport')`),
 * que errava sempre que alguém cadastrasse "Chuteira Society" ou "Tênis de
 * corrida". Hoje o banco tem a coluna `publico`, e o filtro é igualdade.
 */

const TODOS = 'Todos';

/** Texto padrão quando o produto não tem descrição própria no banco. */
const DESCRICAO_PADRAO = 'Fale com a loja para confirmar numeração e cor disponíveis.';

function mensagemDoWhatsApp(produto) {
  return [
    'Ola, equipe Calcados Mariano!',
    '',
    'Estive olhando o site e tenho interesse neste modelo:',
    `Produto: ${produto.nome}`,
    `Cor: ${produto.cor || 'Unica'}`,
    `Numeracao: ${produto.numeracao || 'Consultar'}`,
    `Ref: ${produto.id}`,
    '',
    'Gostaria de confirmar a disponibilidade para provar ou comprar!'
  ].join('\n');
}

function linkDoWhatsApp(produto) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagemDoWhatsApp(produto))}`;
}

function Foto({ produto, className }) {
  // Sem imagem, um desenho local. O código anterior apontava para um serviço
  // de fora: sem internet, ou com o serviço fora do ar, a vitrine inteira
  // ficava de imagem quebrada — justamente a tela que precisa mostrar o
  // calçado.
  if (!produto.imagem_url) return <SemImagem className={className} />;
  return <img className={className} src={produto.imagem_url} alt={produto.nome} />;
}

function VitrineApp() {
  const [produtos, setProdutos] = useState([]);
  const [publicos, setPublicos] = useState([]);
  const [publicoSelecionado, setPublicoSelecionado] = useState(TODOS);
  const [ordenacao, setOrdenacao] = useState('nome');
  const [termoDigitado, setTermoDigitado] = useState('');
  const [termoBuscado, setTermoBuscado] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [temaEscuro, setTemaEscuro] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', temaEscuro);
  }, [temaEscuro]);

  // Os públicos vêm do banco, e não de uma lista fixa aqui. Uma lista fixa sai
  // de sincronia no dia em que alguém cadastrar um produto de público novo.
  useEffect(() => {
    listarOpcoesDeFiltro()
      .then((opcoes) => setPublicos(opcoes.publicos || []))
      .catch(() => setPublicos([]));
  }, []);

  useEffect(() => {
    // `cancelado` protege contra a resposta atrasada. Dois cliques seguidos
    // no filtro disparam dois pedidos, e nada garante que voltem na ordem
    // em que saíram: sem isto, a resposta do filtro antigo chegaria depois
    // e sobrescreveria a lista do filtro que o cliente acabou de escolher.
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      setErro('');
      try {
        // Busca por texto e filtro por público são rotas diferentes na
        // API. Quando há termo, ele manda: quem digitou quer achar
        // aquilo, e não ver o resultado recortado por um filtro que
        // talvez nem lembre que deixou ligado.
        const dados = termoBuscado
          ? { produtos: await buscarProdutos('nome', termoBuscado) }
          : await listarProdutos({
              ordenar: ordenacao,
              ...(publicoSelecionado !== TODOS ? { publico: publicoSelecionado } : {})
            });
        if (cancelado) return;
        setProdutos(dados.produtos || []);
      } catch {
        if (cancelado) return;
        setErro('Não foi possível carregar os produtos. Tente de novo em instantes.');
        setProdutos([]);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [ordenacao, publicoSelecionado, termoBuscado]);

  function aoBuscar(evento) {
    evento.preventDefault();
    setTermoBuscado(termoDigitado.trim());
  }

  function limparBusca() {
    setTermoDigitado('');
    setTermoBuscado('');
  }

  const titulo = termoBuscado
    ? `Resultados para "${termoBuscado}"`
    : `Catálogo de produtos (${publicoSelecionado})`;

  return (
    <div className="site-wrapper">
      {/*
       * A barra antiga anunciava "Compra 100% Segura", "Criptografia SSL" e
       * "Seus dados protegidos". Nada disso acontece aqui: a vitrine não
       * vende, não recebe pagamento e não coleta dado nenhum. Prometer isso
       * numa tela que representa uma loja real é propaganda enganosa, e o
       * cliente que acreditasse esperaria uma compra que o site não faz.
       */}
      <div className="top-bar-security">
        <span>Atendimento pelo WhatsApp</span>
        <span>Retirada nas lojas de {LOJA.cidade}</span>
        <span>Consulte numeração e cor antes de vir</span>
      </div>

      <header className="main-header">
        <div className="header-top-container">
          <div className="header-container">
            <h1 className="logo">
              CALÇADOS <span>MARIANO</span>
            </h1>
            <p className="slogan">A loja do Antônio Lasmar</p>
          </div>

          <div className="theme-switch-wrapper">
            <label className="theme-switch" htmlFor="tema-escuro">
              <input
                type="checkbox"
                id="tema-escuro"
                checked={temaEscuro}
                onChange={(e) => setTemaEscuro(e.target.checked)}
              />
              <div className="slider round"></div>
            </label>
            <span className="theme-label">{temaEscuro ? 'Escuro' : 'Claro'}</span>
          </div>
        </div>

        <form onSubmit={aoBuscar} className="search-bar-container" role="search">
          {/* `search` e não `text`: o teclado do celular mostra a
                        tecla de busca, e o navegador oferece o botão de limpar. */}
          <input
            type="search"
            aria-label="Pesquisar calçado pelo nome"
            placeholder="Pesquisar calçado pelo nome..."
            value={termoDigitado}
            onChange={(e) => setTermoDigitado(e.target.value)}
          />
          <button type="submit">Buscar</button>
          {termoBuscado && (
            <button type="button" onClick={limparBusca}>
              Limpar
            </button>
          )}
        </form>

        <div className="header-actions-bar">
          <nav className="nav-categorias">
            {[TODOS, ...publicos].map((publico) => (
              <button
                key={publico}
                type="button"
                className={`btn-categoria ${publicoSelecionado === publico ? 'ativo' : ''}`}
                onClick={() => {
                  limparBusca();
                  setPublicoSelecionado(publico);
                }}
              >
                {publico}
              </button>
            ))}
          </nav>

          <div className="ordenacao-container">
            <select
              aria-label="Ordenar os produtos"
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="select-ordenacao"
              disabled={Boolean(termoBuscado)}
            >
              {ORDENACOES.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="section-title">
          <h2>{titulo}</h2>
          <p>Consulte tamanhos e cores, e tire dúvidas direto com a nossa equipe</p>
        </div>

        <div className="grid-produtos">
          {carregando && <p className="aviso-vitrine">Carregando os produtos...</p>}

          {!carregando && erro && <p className="aviso-vitrine">{erro}</p>}

          {!carregando && !erro && produtos.length === 0 && (
            <p className="aviso-vitrine">
              Nenhum calçado encontrado. Fale com a loja pelo WhatsApp {LOJA.whatsappVisivel} — o
              que não está aqui pode estar na prateleira.
            </p>
          )}

          {!carregando &&
            !erro &&
            produtos.map((produto) => {
              const quantidade = Number(produto.quantidade) || 0;
              const ultimosPares = quantidade > 0 && quantidade <= 3;

              return (
                <button
                  type="button"
                  className="card"
                  key={produto.id}
                  onClick={() => setProdutoSelecionado(produto)}
                >
                  {ultimosPares && <div className="badge-ultimos-pares">Últimos pares!</div>}
                  {quantidade === 0 && <div className="badge-esgotado">Esgotado</div>}

                  <Foto produto={produto} />
                  <div className="card-info">
                    <span className="marca">{produto.marca || produto.categoria}</span>
                    <h2>{produto.nome}</h2>
                    <p className="tamanhos">Numeração: {produto.numeracao}</p>
                    <p className="cor-card">
                      Cor: <strong>{produto.cor || 'Única'}</strong>
                    </p>
                    <span className="card-acao">Ver detalhes</span>
                  </div>
                </button>
              );
            })}
        </div>
      </main>

      {produtoSelecionado && (
        <div className="modal-overlay" onClick={() => setProdutoSelecionado(null)}>
          <div
            className="modal-content"
            role="dialog"
            aria-label={produtoSelecionado.nome}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Fechar"
              onClick={() => setProdutoSelecionado(null)}
            >
              X
            </button>

            <div className="modal-grid">
              <div className="modal-img-container">
                <Foto produto={produtoSelecionado} />
              </div>
              <div className="modal-details">
                <span className="marca">
                  {produtoSelecionado.marca || produtoSelecionado.categoria}
                </span>
                <h2>{produtoSelecionado.nome}</h2>

                <div className="modal-secao-info">
                  <p>
                    <strong>Numeração:</strong> {produtoSelecionado.numeracao}
                  </p>
                  <p>
                    <strong>Cor:</strong> {produtoSelecionado.cor || 'Única'}
                  </p>
                  <p>
                    <strong>Em estoque:</strong>{' '}
                    {Number(produtoSelecionado.quantidade) === 0 ? (
                      <span className="marca-esgotado">Produto esgotado</span>
                    ) : (
                      <>
                        {produtoSelecionado.quantidade}
                        {Number(produtoSelecionado.quantidade) <= 3 && (
                          <span className="marca-poucas">Poucas unidades</span>
                        )}
                      </>
                    )}
                  </p>
                  <p>
                    <strong>Detalhes:</strong> {produtoSelecionado.descricao || DESCRICAO_PADRAO}
                  </p>
                </div>

                <div className="modal-botoes">
                  <a
                    href={linkDoWhatsApp(produtoSelecionado)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-whatsapp"
                  >
                    Consultar no WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-col">
            <h3>{LOJA.nome}</h3>
            <p>Tradição e qualidade em calçados para toda a família.</p>
          </div>
          <div className="footer-col">
            <h3>Nossas lojas em {LOJA.cidade}</h3>
            {LOJA.unidades.map((unidade) => (
              <p key={unidade.rotulo}>
                {unidade.rotulo}: {unidade.telefone}
              </p>
            ))}
            <p>WhatsApp: {LOJA.whatsappVisivel}</p>
          </div>
          <div className="footer-col">
            <h3>Como funciona</h3>
            <p>A vitrine mostra o que temos em estoque.</p>
            <p>A conversa e a compra acontecem no WhatsApp ou na loja.</p>
            <p>Passe para provar antes de levar.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 {LOJA.nome}.</p>
        </div>
      </footer>
    </div>
  );
}

export default VitrineApp;
