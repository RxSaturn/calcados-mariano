import { useCallback, useEffect, useMemo, useState } from 'react';
import './Painel.css';

import Header from './components/Header';
import BuscaForm from './components/BuscaForm';
import EstoqueTable from './components/EstoqueTable';
import ProdutoForm from './components/ProdutoForm';
import Footer from './components/Footer';
import LoginForm from './components/LoginForm';

import {
  adicionarProduto,
  atualizarProduto,
  buscarProdutos,
  listarProdutos,
  removerProduto,
  obterSessao,
  sair
} from '../api/produtos';
import { LIMITE_ESTOQUE_BAIXO } from '../config';

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
  // O produto que está aberto para edição. `null` deixa o formulário no modo de
  // cadastro, que é o estado normal da tela.
  const [emEdicao, setEmEdicao] = useState(null);
  // null enquanto o servidor ainda não respondeu quem é. Sem esse terceiro
  // estado, a tela piscaria o formulário de login para quem já está logado.
  const [temSessao, setTemSessao] = useState(null);

  useEffect(() => {
    let ativo = true;
    obterSessao()
      .then((s) => ativo && setTemSessao(Boolean(s?.autenticado)))
      .catch(() => ativo && setTemSessao(false));
    return () => {
      ativo = false;
    };
  }, []);

  /*
   * A sessão dura oito horas e pode acabar no meio do expediente. Quando isso
   * acontece, uma escrita volta 401 e o certo é pedir a senha de novo: mostrar
   * "erro ao cadastrar" faria o dono repetir o cadastro achando que o produto
   * tem algum problema, quando o que venceu foi a sessão.
   */
  const tratarFalha = useCallback((falha) => {
    if (falha.status === 401) {
      setTemSessao(false);
      return true;
    }
    return false;
  }, []);

  const carregarTudo = useCallback(async () => {
    setCarregando(true);
    setErro('');
    setFiltro(null);
    try {
      // listarProdutos devolve o envelope { produtos, total, ... }.
      const resposta = await listarProdutos();
      setProdutos(resposta.produtos);
    } catch (falha) {
      if (!tratarFalha(falha)) setErro(falha.message);
      setProdutos([]);
    } finally {
      setCarregando(false);
    }
  }, [tratarFalha]);

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
    try {
      await adicionarProduto(produto);
    } catch (falha) {
      // A sessão vencida volta ao login; o resto sobe para o formulário mostrar
      // os erros de validação campo a campo.
      if (tratarFalha(falha)) return;
      throw falha;
    }
    // Recarrega a lista para o produto novo aparecer com o id que o banco gerou.
    await carregarTudo();
  };

  const salvar = async (id, produto) => {
    try {
      await atualizarProduto(id, produto);
    } catch (falha) {
      if (tratarFalha(falha)) return;
      throw falha;
    }
    setEmEdicao(null);
    await carregarTudo();
  };

  const remover = async (produto) => {
    try {
      await removerProduto(produto.id);
    } catch (falha) {
      if (!tratarFalha(falha)) setErro(falha.message);
      return;
    }
    // Se o produto removido era o que estava aberto para edição, o formulário
    // precisa fechar: salvar depois disso daria 404, e a mensagem não diria que
    // o produto já não existe.
    setEmEdicao((atual) => (atual && atual.id === produto.id ? null : atual));
    await carregarTudo();
  };

  const totalBaixo = useMemo(
    () => produtos.filter((p) => p.quantidade <= LIMITE_ESTOQUE_BAIXO).length,
    [produtos]
  );

  async function encerrarSessao() {
    try {
      await sair();
    } finally {
      // Mesmo que a chamada falhe, a tela volta ao login: quem clicou em sair
      // quer sair, e deixar o painel aberto seria o oposto do pedido.
      setTemSessao(false);
    }
  }

  if (temSessao === null) {
    return <p className="painel-aguardando">Carregando o painel...</p>;
  }

  if (!temSessao) {
    return <LoginForm aoEntrar={() => setTemSessao(true)} />;
  }

  return (
    <div className="painel">
      <Header total={produtos.length} totalBaixo={totalBaixo} onSair={encerrarSessao} />

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
            onEditar={setEmEdicao}
            onRemover={remover}
            produtos={produtos}
            carregando={carregando}
            erro={erro}
            onTentarDeNovo={carregarTudo}
          />
        </section>

        <ProdutoForm
          key={emEdicao ? `edicao-${emEdicao.id}` : 'cadastro'}
          onCadastrar={cadastrar}
          produto={emEdicao}
          onSalvar={salvar}
          onCancelar={() => setEmEdicao(null)}
        />
      </main>

      <Footer />
    </div>
  );
}

export default App;
