import { useState } from 'react';

import { PUBLICOS } from '../../config';

const VAZIO = {
  nome: '',
  categoria: '',
  publico: 'Unissex',
  numeracao: '',
  quantidade: '',
  status_estoque: 'Em estoque'
};

/**
 * Os campos, prontos para o formulário: o produto escolhido, ou tudo em branco.
 *
 * Quem troca o produto em edição é quem monta este componente, passando outra
 * `key`. Isso remonta o formulário com os campos certos, em vez de copiar a
 * propriedade para o estado dentro de um efeito — que apagaria o que a pessoa
 * digitou toda vez que a tela ao redor renderizasse de novo.
 */
function preencher(produto) {
  if (!produto) return VAZIO;
  return {
    nome: produto.nome ?? '',
    categoria: produto.categoria ?? '',
    publico: produto.publico ?? 'Unissex',
    numeracao: produto.numeracao ?? '',
    quantidade: String(produto.quantidade ?? ''),
    status_estoque: produto.status_estoque ?? 'Em estoque'
  };
}

// Formulário de produto, usado para cadastrar e para editar.
//
// É o mesmo formulário nos dois casos de propósito: os campos são os mesmos, e duas
// telas quase iguais viram duas telas que divergem — a segunda esquece o campo que a
// primeira ganhou. O que muda é o título, o texto do botão e para onde os dados vão.
//
// A API valida cada campo e devolve a lista de erros em 400, portanto a tela não
// repete essa regra: ela mostra o que o servidor disse.
function ProdutoForm({ onCadastrar, produto, onSalvar, onCancelar }) {
  const editando = Boolean(produto);
  const [dados, setDados] = useState(() => preencher(produto));
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
      const enviado = { ...dados, quantidade: Number(dados.quantidade) };
      if (editando) {
        await onSalvar(produto.id, enviado);
        setSucesso('Produto salvo.');
      } else {
        await onCadastrar(enviado);
        setDados(VAZIO);
        setSucesso('Produto cadastrado.');
      }
    } catch (erro) {
      setErros(erro.erros?.length > 0 ? erro.erros : [erro.message]);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="cadastro">
      <h2>{editando ? `Editar ${produto.nome}` : 'Cadastrar produto'}</h2>

      <form className="cadastro-form" onSubmit={enviar}>
        <label className="campo">
          <span>Nome</span>
          <input type="text" value={dados.nome} onChange={mudar('nome')} />
        </label>

        <label className="campo">
          <span>Categoria</span>
          <input type="text" value={dados.categoria} onChange={mudar('categoria')} />
        </label>

        <label className="campo">
          {/* O público define em qual filtro da vitrine o produto aparece. A API o exige,
              e sem ele o cadastro voltaria 400. */}
          <span>Público</span>
          <select value={dados.publico} onChange={mudar('publico')}>
            {PUBLICOS.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
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
          {enviando ? 'Salvando...' : editando ? 'Salvar' : 'Cadastrar'}
        </button>

        {editando && (
          <button type="button" className="btn btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
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
