import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

import Header from './components/Header';
import BuscaForm from './components/BuscaForm';
import EstoqueTable from './components/EstoqueTable';
import ProdutoForm from './components/ProdutoForm';
import Footer from './components/Footer';

import { adicionarProduto, buscarProdutos, listarProdutos } from './api/produtos';
import { LIMITE_ESTOQUE_BAIXO } from './config';

// Painel de estoque. Este componente só compõe a tela e guarda o estado. Cada parte da
// interface vive em src/components.
//
// Antes desta versão, o arquivo tinha 233 linhas, montava toda a interface de uma vitrine
// e lia os produtos de uma lista fixa chamada produtosMock. Nada aqui chamava a API.
function App() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [filtro, setFiltro] = useState(null);

  const carregarTudo = useCallback(async () => {
    setCarregando(true);
    setErro('');
    setFiltro(null);
    try {
      // listarProdutos devolve o envelope { produtos, total, ... }.
      const resposta = await listarProdutos();
      setProdutos(resposta.produtos);
    } catch (falha) {
      setErro(falha.message);
      setProdutos([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  // A carga inicial não reaproveita carregarTudo de propósito. Aqui o estado só muda
  // depois do await, e a flag 'ativo' evita atualizar estado de um componente que já
  // saiu da tela.
  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const resposta = await listarProdutos();
        if (ativo) setProdutos(resposta.produtos);
      } catch (falha) {
        if (ativo) setErro(falha.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, []);

  const buscar = async (tipo, termo) => {
    setBuscando(true);
    setErro('');
    try {
      setProdutos(await buscarProdutos(tipo, termo));
      setFiltro({ tipo, termo });
    } catch (falha) {
      setErro(falha.message);
      setProdutos([]);
    } finally {
      setBuscando(false);
    }
  };

  const cadastrar = async (produto) => {
    await adicionarProduto(produto);
    // Recarrega a lista para o produto novo aparecer com o id que o banco gerou.
    await carregarTudo();
  };

  const totalBaixo = useMemo(
    () => produtos.filter((p) => p.quantidade <= LIMITE_ESTOQUE_BAIXO).length,
    [produtos]
  );

  return (
    <div className="painel">
      <Header total={produtos.length} totalBaixo={totalBaixo} />

      <main className="painel-conteudo">
        <section className="estoque">
          <div className="estoque-cabecalho">
            <h2>Estoque</h2>
            {filtro && (
              <p className="filtro-ativo">
                Filtrando por {filtro.tipo}: <strong>{filtro.termo}</strong>
              </p>
            )}
          </div>

          <BuscaForm
            onBuscar={buscar}
            onLimpar={carregarTudo}
            buscando={buscando}
            filtroAtivo={Boolean(filtro)}
          />

          <EstoqueTable
            produtos={produtos}
            carregando={carregando}
            erro={erro}
            onTentarDeNovo={carregarTudo}
          />
        </section>

        <ProdutoForm onCadastrar={cadastrar} />
      </main>

      <Footer />
    </div>
  );
}

export default App;
