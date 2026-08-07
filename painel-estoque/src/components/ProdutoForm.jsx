import { useState } from 'react';

const VAZIO = {
  nome: '',
  categoria: '',
  numeracao: '',
  quantidade: '',
  status_estoque: 'Em estoque'
};

// Formulário de cadastro. Chama POST /produtos e mostra a lista de erros que a API
// devolve em 400. A API valida cada campo, portanto a tela não repete essa regra.
function ProdutoForm({ onCadastrar }) {
  const [dados, setDados] = useState(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState([]);
  const [sucesso, setSucesso] = useState('');

  const mudar = (campo) => (evento) => setDados({ ...dados, [campo]: evento.target.value });

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setErros([]);
    setSucesso('');

    try {
      // A API exige quantidade como número inteiro. O input devolve texto.
      await onCadastrar({ ...dados, quantidade: Number(dados.quantidade) });
      setDados(VAZIO);
      setSucesso('Produto cadastrado.');
    } catch (erro) {
      setErros(erro.erros?.length > 0 ? erro.erros : [erro.message]);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="cadastro">
      <h2>Cadastrar produto</h2>

      <form className="cadastro-form" onSubmit={enviar}>
        <label className="campo">
          <span>Nome</span>
          <input type="text" value={dados.nome} onChange={mudar('nome')} />
        </label>

        <label className="campo">
          <span>Categoria</span>
          <input type="text" value={dados.categoria} onChange={mudar('categoria')} />
        </label>

        <label className="campo campo-curto">
          <span>Numeração</span>
          <input type="text" value={dados.numeracao} onChange={mudar('numeracao')} />
        </label>

        <label className="campo campo-curto">
          <span>Quantidade</span>
          <input type="number" min="0" value={dados.quantidade} onChange={mudar('quantidade')} />
        </label>

        <label className="campo">
          <span>Situação</span>
          <select value={dados.status_estoque} onChange={mudar('status_estoque')}>
            <option value="Em estoque">Em estoque</option>
            <option value="Últimas unidades">Últimas unidades</option>
            <option value="Sem estoque">Sem estoque</option>
          </select>
        </label>

        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Salvando...' : 'Cadastrar'}
        </button>
      </form>

      {erros.length > 0 && (
        <ul className="aviso aviso-erro" role="alert">
          {erros.map((mensagem) => (
            <li key={mensagem}>{mensagem}</li>
          ))}
        </ul>
      )}

      {sucesso && (
        <p className="aviso aviso-sucesso" role="status">
          {sucesso}
        </p>
      )}
    </section>
  );
}

export default ProdutoForm;
