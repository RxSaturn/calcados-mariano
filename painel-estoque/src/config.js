// Configuração da interface. Antes deste arquivo, os telefones da loja e o número de
// WhatsApp estavam fixos dentro do componente App.

// URL base da API. Em desenvolvimento, o vite.config.js encaminha /produtos e /health
// para a porta 3000, portanto o padrão vazio funciona sem variável de ambiente.
export const URL_API = import.meta.env.VITE_API_URL || '';

// Acima deste limite, o estoque está confortável. Abaixo ou igual, a linha recebe
// destaque na tabela. Este é o motivo de existir do sistema.
export const LIMITE_ESTOQUE_BAIXO = Number(import.meta.env.VITE_ESTOQUE_BAIXO) || 10;

// Os tipos que a rota GET /produtos/buscar aceita no parâmetro 'tipo'.
export const TIPOS_DE_BUSCA = [
  { valor: 'nome', rotulo: 'Nome' },
  { valor: 'categoria', rotulo: 'Categoria' },
  { valor: 'numeracao', rotulo: 'Numeração' }
];

// Dados da loja. Ficam aqui, e não dentro de um componente, para sair do código quando
// o time decidir o licenciamento. Veja a seção de licença no README.
export const LOJA = {
  nome: 'Calçados Mariano',
  descricao: 'Controle de estoque das duas unidades',
  unidades: [
    { rotulo: 'Matriz', telefone: '(37) 3431-2762' },
    { rotulo: 'Filial', telefone: '(37) 3431-2270' }
  ]
};
