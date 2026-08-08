import { useState, useEffect } from 'react';
import './vitrine.css';

function App() {
  const [todosProdutos, setTodosProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [termoBusca, setTermoBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('padrao');
  const [darkMode, setDarkMode] = useState(false);

  const numeroWhatsApp = "553798414547";
  const API_URL = "";

  // Efeito para alternar a classe dark-mode no body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Carrega todos os produtos do banco assim que a página abre
  useEffect(() => {
    carregarProdutos();
  }, []);

  // Filtro inteligente, busca e ordenação
  useEffect(() => {
    let resultado = [...todosProdutos];

    // Filtro por Categoria Inteligente
    if (categoriaSelecionada !== 'Todos') {
      const catBusca = categoriaSelecionada.toLowerCase();
      
      resultado = resultado.filter(p => {
        const catProduto = (p.categoria || '').toLowerCase();
        const nomeProduto = (p.nome || '').toLowerCase();

        if (catBusca === 'esporte') {
          return catProduto.includes('esport') || catProduto.includes('futsal') || catProduto.includes('corrida') || nomeProduto.includes('chuteira') || nomeProduto.includes('tênis');
        }
        if (catBusca === 'masculino') {
          return catProduto.includes('masculino') || catProduto.includes('sapato') || catProduto.includes('social') || catProduto.includes('botina');
        }
        if (catBusca === 'feminino') {
          return catProduto.includes('feminino') || catProduto.includes('sandália') || catProduto.includes('rasteirinha') || catProduto.includes('tamanco') || catProduto.includes('sapatilha');
        }

        return catProduto.includes(catBusca);
      });
    }

    // Filtro por Termo de Busca
    if (termoBusca.trim() !== '') {
      const termo = termoBusca.toLowerCase();
      resultado = resultado.filter(p => 
        (p.nome && p.nome.toLowerCase().includes(termo)) ||
        (p.marca && p.marca.toLowerCase().includes(termo)) ||
        (p.cor && p.cor.toLowerCase().includes(termo)) ||
        (p.numeracao && p.numeracao.toString().toLowerCase().includes(termo)) ||
        (p.descricao && p.descricao.toLowerCase().includes(termo))
      );
    }

    // Ordenação
    if (ordenacao === 'az') {
      resultado.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    } else if (ordenacao === 'za') {
      resultado.sort((a, b) => (b.nome || '').localeCompare(a.nome || ''));
    } else if (ordenacao === 'estoque') {
      resultado.sort((a, b) => (Number(a.quantidade) || 0) - (Number(b.quantidade) || 0));
    }

    setProdutosFiltrados(resultado);
  }, [categoriaSelecionada, termoBusca, ordenacao, todosProdutos]);

  const carregarProdutos = async () => {
    try {
      const resposta = await fetch(`${API_URL}/produtos`);
      const dados = await resposta.json();
      
      if (Array.isArray(dados)) {
        setTodosProdutos(dados);
        setProdutosFiltrados(dados);
      } else {
        setTodosProdutos([]);
        setProdutosFiltrados([]);
      }
    } catch (erro) {
      console.error("Erro ao conectar com o banco de dados via backend:", erro);
      setTodosProdutos([]);
      setProdutosFiltrados([]);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
  };

  return (
    <div className="site-wrapper">
      <div className="top-bar-security">
        <span>Compra 100% Segura e Verificada</span>
        <span>Site Protegido com Criptografia SSL</span>
        <span>Atendimento e Suporte via WhatsApp</span>
      </div>

      <header className="main-header">
        <div className="header-top-container">
          <div className="header-container">
            <h1 className="logo">CALÇADOS <span>MARIANO</span></h1>
            <p className="slogan">A loja do Antônio Lasmar</p>
          </div>

          <div className="theme-switch-wrapper">
            <label className="theme-switch" htmlFor="checkbox">
              <input 
                type="checkbox" 
                id="checkbox" 
                checked={darkMode} 
                onChange={(e) => setDarkMode(e.target.checked)} 
              />
              <div className="slider round"></div>
            </label>
            <span className="theme-label">{darkMode ? 'Escuro' : 'Claro'}</span>
          </div>
        </div>

        <form onSubmit={handleBuscar} className="search-bar-container">
          <input 
            type="text" 
            placeholder="Pesquisar calçado, marca, cor ou numeração..." 
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>

        <div className="header-actions-bar">
          <nav className="nav-categorias">
            {['Todos', 'Masculino', 'Feminino', 'Esporte'].map((cat) => (
              <button
                key={cat}
                className={`btn-categoria ${categoriaSelecionada === cat ? 'ativo' : ''}`}
                onClick={() => setCategoriaSelecionada(cat)}
              >
                {cat}
              </button>
            ))}
          </nav>

          <div className="ordenacao-container">
            <select 
              value={ordenacao} 
              onChange={(e) => setOrdenacao(e.target.value)}
              className="select-ordenacao"
            >
              <option value="padrao">Ordenar por: Destaques</option>
              <option value="az">Nome: A - Z</option>
              <option value="za">Nome: Z - A</option>
              <option value="estoque">Menor Estoque</option>
            </select>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="section-title">
          <h2>Catálogo de Produtos ({categoriaSelecionada})</h2>
          <p>Consulte os tamanhos, cores e tire dúvidas diretamente com nossa equipe</p>
        </div>

        <div className="grid-produtos">
          {produtosFiltrados.length > 0 ? (
            produtosFiltrados.map((produto) => {
              const qtd = Number(produto.quantidade) || 0;
              const ehUltimosPares = qtd > 0 && qtd <= 3;

              return (
                <div 
                  className="card" 
                  key={produto.id || produto._id} 
                  onClick={() => setProdutoSelecionado(produto)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="badge-seguranca">Garantia Mariano</div>
                  
                  {ehUltimosPares && (
                    <div className="badge-ultimos-pares">Ultimos Pares!</div>
                  )}

                  <img src={produto.imagem_url || produto.imagem || "https://via.placeholder.com/300x300?text=Sem+Imagem"} alt={produto.nome} />
                  <div className="card-info">
                    <span className="marca">{produto.marca || produto.categoria}</span>
                    <h2>{produto.nome}</h2>
                    <p className="tamanhos">Numeração: {produto.numeracao || produto.tamanhos}</p>
                    <p className="cor-card">
                      Cor: <strong>{produto.cor || 'Única'}</strong>
                    </p>
                    
                    <button className="btn-whatsapp" style={{ width: '100%', border: 'none', pointerEvents: 'none', marginTop: '10px' }}>
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#666', padding: '40px' }}>
              Nenhum produto encontrado no banco de dados.
            </p>
          )}
        </div>
      </main>

      {produtoSelecionado && (
        <div className="modal-overlay" onClick={() => setProdutoSelecionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setProdutoSelecionado(null)}>X</button>
            
            <div className="modal-grid">
              <div className="modal-img-container">
                <img src={produtoSelecionado.imagem_url || produtoSelecionado.imagem || "https://via.placeholder.com/300x300?text=Sem+Imagem"} alt={produtoSelecionado.nome} />
              </div>
              <div className="modal-details">
                <span className="marca">{produtoSelecionado.marca || produtoSelecionado.categoria}</span>
                <h2>{produtoSelecionado.nome}</h2>
                
                <div className="modal-secao-info">
                  <p><strong>Numeração Disponível:</strong> {produtoSelecionado.numeracao || produtoSelecionado.tamanhos}</p>
                  <p><strong>Cor Disponível:</strong> <span style={{ fontWeight: 'bold' }}>{produtoSelecionado.cor || 'Única'}</span></p>
                  <p>
                    <strong>Quantidade em Estoque:</strong>{' '}
                    {produtoSelecionado.quantidade === 0 || produtoSelecionado.quantidade === '0' ? (
                      <span style={{ backgroundColor: '#ffcccc', color: '#cc0000', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block' }}>
                        Produto Esgotado
                      </span>
                    ) : (
                      <>
                        {produtoSelecionado.quantidade}
                        {Number(produtoSelecionado.quantidade) <= 3 && (
                          <span style={{ marginLeft: '10px', backgroundColor: '#fff3cd', color: '#856404', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            Poucas unidades!
                          </span>
                        )}
                      </>
                    )}
                  </p>
                  <p><strong>Detalhes:</strong> {produtoSelecionado.descricao || "Calçado original com total garantia de qualidade da Calçados Mariano."}</p>
                </div>

                <div className="modal-botoes">
                  {/* Mensagem Inteligente do WhatsApp 100% sem Emojis */}
                  <a 
                    href={`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(`Ola, equipe Calcados Mariano!\n\nEstive olhando o site e tenho interesse neste modelo:\nProduto: ${produtoSelecionado.nome}\nCor: ${produtoSelecionado.cor || 'Única'}\nNumeracao: ${produtoSelecionado.numeracao || 'Consultar'}\nRef: ${produtoSelecionado.id}\n\nGostaria de confirmar a disponibilidade para provar ou comprar!`)}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-whatsapp"
                    style={{ textAlign: 'center', display: 'block', padding: '12px', textDecoration: 'none' }}
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
            <h3>Calçados Mariano</h3>
            <p>Tradição e qualidade em calçados para toda a família.</p>
          </div>
          <div className="footer-col">
            <h3>Nossos Contatos & Lojas (Bambuí - MG)</h3>
            <p>Matriz: (37) 3431-2762</p>
            <p>Filial: (37) 3431-2270</p>
            <p>WhatsApp: (37) 9841-4547</p>
          </div>
          <div className="footer-col">
            <h3>Segurança e Privacidade</h3>
            <p>Ambiente 100% Seguro</p>
            <p>Parcerias Verificadas</p>
            <p>Seus dados protegidos</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Calçados Mariano - Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default App;