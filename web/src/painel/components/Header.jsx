import { LOJA } from '../../config';

// Cabeçalho do painel. Mostra o nome da loja e um resumo do estoque carregado.
function Header({ total, totalBaixo, onSair }) {
  return (
    <header className="painel-header">
      <div className="painel-header-titulo">
        <h1>{LOJA.nome}</h1>
        <p>{LOJA.descricao}</p>
      </div>

      {onSair && (
        <button type="button" className="painel-sair" onClick={onSair}>
          Sair
        </button>
      )}

      <dl className="painel-resumo">
        <div className="resumo-item">
          <dt>Produtos</dt>
          <dd>{total}</dd>
        </div>
        <div className={`resumo-item ${totalBaixo > 0 ? 'resumo-alerta' : ''}`}>
          <dt>Estoque baixo</dt>
          <dd>{totalBaixo}</dd>
        </div>
      </dl>
    </header>
  );
}

export default Header;
