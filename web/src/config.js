// Configuração da interface. Antes deste arquivo, os telefones da loja e o número de
// WhatsApp estavam fixos dentro do componente App.

// URL base da API. Em desenvolvimento, o vite.config.js encaminha /produtos e /health
// para a porta 3000, portanto o padrão vazio funciona sem variável de ambiente.
export const URL_API = import.meta.env.VITE_API_URL || '';

// Acima deste limite, o estoque está confortável. Abaixo ou igual, a linha recebe
// destaque na tabela. Este é o motivo de existir do sistema.
export const LIMITE_ESTOQUE_BAIXO = Number(import.meta.env.VITE_ESTOQUE_BAIXO) || 10;

// Públicos aceitos pela API, na coluna publico. Precisa casar com a tabela PUBLICOS em
// src/models/ProdutoModel.js. Um valor fora da lista faz o cadastro responder 400.
export const PUBLICOS = ['Masculino', 'Feminino', 'Infantil', 'Unissex'];

// Os tipos que a rota GET /produtos/buscar aceita no parâmetro 'tipo'.
export const TIPOS_DE_BUSCA = [
  { valor: 'nome', rotulo: 'Nome' },
  { valor: 'categoria', rotulo: 'Categoria' },
  { valor: 'numeracao', rotulo: 'Numeração' }
];

// As ordenações que a rota GET /produtos aceita no parâmetro 'ordenar'. Precisa casar
// com a tabela ORDENACOES em src/models/ProdutoModel.js: um valor fora dela faz a API
// responder 400, em vez de cair no padrão em silêncio.
export const ORDENACOES = [
  { valor: 'nome', rotulo: 'Nome: A - Z' },
  { valor: 'nome_desc', rotulo: 'Nome: Z - A' },
  { valor: 'recentes', rotulo: 'Cadastrados por último' },
  { valor: 'quantidade', rotulo: 'Menor estoque' },
  { valor: 'quantidade_desc', rotulo: 'Maior estoque' }
];

// Número de WhatsApp da loja, em formato internacional e só com dígitos, porque é isso
// que o endereço wa.me aceita. Antes deste valor, o número estava fixo no meio do
// componente da vitrine, e trocá-lo exigia mexer no código da tela.
export const WHATSAPP = import.meta.env.VITE_WHATSAPP || '553798414547';

// Dados da loja. Ficam aqui, e não dentro de um componente, para sair do código quando
// o time decidir o licenciamento. Veja a seção de licença no README.
export const LOJA = {
  nome: 'Calçados Mariano',
  descricao: 'Controle de estoque das duas unidades',
  cidade: 'Bambuí (MG)',
  // O mesmo número de WHATSAPP, escrito como as pessoas leem.
  whatsappVisivel: '(37) 9841-4547',
  unidades: [
    { rotulo: 'Matriz', telefone: '(37) 3431-2762' },
    { rotulo: 'Filial', telefone: '(37) 3431-2270' }
  ]
};
