import EstoqueRow from './EstoqueRow';

// Tabela de estoque. Trata os quatro estados da lista: carregando, erro, vazia e com
// dados. A tabela substitui a grade de cards da vitrine, porque o painel mostra
// quantidade e situação, e não preço e foto.
function EstoqueTable({ produtos, carregando, erro, onTentarDeNovo, onEditar, onRemover }) {
  if (carregando) {
    return <p className="aviso">Carregando o estoque...</p>;
  }

  if (erro) {
    return (
      <div className="aviso aviso-erro" role="alert">
        <p>{erro}</p>
        <button type="button" className="btn btn-secundario" onClick={onTentarDeNovo}>
          Tentar de novo
        </button>
      </div>
    );
  }

  if (produtos.length === 0) {
    return <p className="aviso">Nenhum produto encontrado.</p>;
  }

  return (
    <div className="tabela-wrapper">
      <table className="tabela-estoque">
        <caption className="sr-only">Estoque de calçados</caption>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Categoria</th>
            <th scope="col">Numeração</th>
            <th scope="col">Quantidade</th>
            <th scope="col">Situação</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto) => (
            <EstoqueRow
              key={produto.id}
              produto={produto}
              onEditar={onEditar}
              onRemover={onRemover}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EstoqueTable;
