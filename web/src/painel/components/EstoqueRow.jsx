import { useState } from 'react';

import { LIMITE_ESTOQUE_BAIXO } from '../../config';

// Uma linha da tabela de estoque. A linha recebe destaque quando a quantidade está no
// limite ou abaixo dele, porque avisar sobre falta é o motivo de existir do sistema.
function EstoqueRow({ produto, onEditar, onRemover }) {
  const baixo = produto.quantidade <= LIMITE_ESTOQUE_BAIXO;
  // A confirmação fica na própria linha, e não numa janela do navegador. Numa
  // janela o texto some junto com o contexto, e quem confirma não vê mais qual
  // produto vai sumir.
  const [confirmando, setConfirmando] = useState(false);

  return (
    <tr className={baixo ? 'linha-estoque-baixo' : ''}>
      <td>{produto.nome}</td>
      <td>{produto.categoria}</td>
      <td className="celula-numero">{produto.numeracao}</td>
      <td className="celula-numero">
        {produto.quantidade}
        {baixo && (
          <span className="etiqueta-baixo" title={`No limite de ${LIMITE_ESTOQUE_BAIXO} ou abaixo`}>
            baixo
          </span>
        )}
      </td>
      <td>{produto.status_estoque}</td>
      <td className="celula-acoes">
        {confirmando ? (
          <>
            <span className="confirma-texto">Remover?</span>
            <button type="button" className="btn btn-perigo" onClick={() => onRemover(produto)}>
              Sim, remover
            </button>
            <button
              type="button"
              className="btn btn-secundario"
              onClick={() => setConfirmando(false)}
            >
              Não
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-secundario" onClick={() => onEditar(produto)}>
              Editar
            </button>
            <button
              type="button"
              className="btn btn-secundario"
              onClick={() => setConfirmando(true)}
            >
              Remover
            </button>
          </>
        )}
      </td>
    </tr>
  );
}

export default EstoqueRow;
