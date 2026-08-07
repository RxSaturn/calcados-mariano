const db = require('../config/db');

// Tipos de busca aceitos. Cada tipo diz qual coluna consultar e se a comparação é exata.
// Esta tabela é a única fonte dos nomes de coluna usados na consulta de busca.
const TIPOS_DE_BUSCA = {
    nome: { coluna: 'nome', exata: false },
    categoria: { coluna: 'categoria', exata: false },
    numeracao: { coluna: 'numeracao', exata: true } // Numeração precisa ser exata (ex: 41)
};

// Marca o erro como falha de validação. O controller usa essa marca para responder 400.
const erroDeValidacao = (mensagem) => {
    const erro = new Error(mensagem);
    erro.validacao = true;
    return erro;
};

const ProdutoModel = {
    // 1. Função que lista tudo
    listarTodos: (callback) => {
        db.all('SELECT * FROM produtos', [], callback);
    },

    // 2.Função que adiciona um produto
    adicionar: (produto, callback) => {
        const sql = 'INSERT INTO produtos (nome, categoria, quantidade, status_estoque, numeracao) VALUES (?, ?, ?, ?, ?)';
        const valores = [produto.nome, produto.categoria, produto.quantidade, produto.status_estoque, produto.numeracao];
        
        // db.run usado para modificar o banco (inserir, atualizar, apagar)
        db.run(sql, valores, callback);
    },

    // 3. Função: Pesquisar por nome, categoria ou numeração
    buscar: (termo, tipo, callback) => {
        // hasOwnProperty evita que nomes herdados de Object, como 'constructor',
        // passem por tipo válido.
        const tipoValido = typeof tipo === 'string'
            && Object.prototype.hasOwnProperty.call(TIPOS_DE_BUSCA, tipo);

        // Sem um tipo válido não existe consulta para montar. Esta função antes deixava
        // a consulta vazia e chamava db.all(''), e o driver sqlite3 derrubava o processo
        // com segmentation fault. Nunca monte a consulta fora desta tabela.
        if (!tipoValido) {
            const aceitos = Object.keys(TIPOS_DE_BUSCA).join(', ');
            return callback(erroDeValidacao(
                `O parâmetro "tipo" é obrigatório e precisa ser um destes: ${aceitos}.`
            ));
        }

        if (typeof termo !== 'string' || termo.trim() === '') {
            return callback(erroDeValidacao('O parâmetro "termo" é obrigatório.'));
        }

        const busca = TIPOS_DE_BUSCA[tipo];
        const comparacao = busca.exata ? '=' : 'LIKE';

        // O nome da coluna vem da tabela acima, nunca do pedido, portanto a interpolação
        // é segura. O valor procurado continua como parâmetro do driver.
        const sql = `SELECT * FROM produtos WHERE ${busca.coluna} ${comparacao} ?`;
        const valor = busca.exata ? termo : '%' + termo + '%'; // O % acha palavras parecidas

        db.all(sql, [valor], callback);
    }
};

module.exports = ProdutoModel;
