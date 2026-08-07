import { LIMITE_ESTOQUE_BAIXO } from '../config';

// Uma linha da tabela de estoque. A linha recebe destaque quando a quantidade está no
// limite ou abaixo dele, porque avisar sobre falta é o motivo de existir do sistema.
function EstoqueRow({ produto }) {
  const baixo = produto.quantidade <= LIMITE_ESTOQUE_BAIXO;

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
    </tr>
  );
}

export default EstoqueRow;
