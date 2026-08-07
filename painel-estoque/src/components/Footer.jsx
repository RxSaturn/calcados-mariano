import { LOJA } from '../config';

// Rodapé do painel. Os telefones vêm de src/config.js, e não de dentro do componente.
function Footer() {
  return (
    <footer className="painel-footer">
      <p>
        {LOJA.nome}
        {LOJA.unidades.map(({ rotulo, telefone }) => (
          <span key={rotulo} className="footer-unidade">
            {rotulo}: {telefone}
          </span>
        ))}
      </p>
      <p className="footer-nota">Uso interno. Este painel não é a loja online.</p>
    </footer>
  );
}

export default Footer;
