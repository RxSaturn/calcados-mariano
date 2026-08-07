import { useState } from 'react';
import { TIPOS_DE_BUSCA } from '../config';

// Formulário de busca. O seletor de 'tipo' existe porque a rota GET /produtos/buscar
// exige esse parâmetro. Um pedido sem ele responde 400.
function BuscaForm({ onBuscar, onLimpar, buscando, filtroAtivo }) {
  const [tipo, setTipo] = useState('nome');
  const [termo, setTermo] = useState('');

  const enviar = (evento) => {
    evento.preventDefault();
    if (termo.trim() === '') return;
    onBuscar(tipo, termo.trim());
  };

  const limpar = () => {
    setTermo('');
    onLimpar();
  };

  return (
    <form className="busca-form" onSubmit={enviar}>
      <label className="campo">
        <span>Buscar por</span>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS_DE_BUSCA.map(({ valor, rotulo }) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </label>

      <label className="campo campo-cresce">
        <span>Termo</span>
        <input
          type="text"
          value={termo}
          placeholder="Ex: bota, Sapato, 41"
          onChange={(e) => setTermo(e.target.value)}
        />
      </label>

      <div className="busca-acoes">
        <button
          type="submit"
          className="btn btn-primario"
          disabled={buscando || termo.trim() === ''}
        >
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
        {filtroAtivo && (
          <button type="button" className="btn btn-secundario" onClick={limpar}>
            Mostrar tudo
          </button>
        )}
      </div>
    </form>
  );
}

export default BuscaForm;
