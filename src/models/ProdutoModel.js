const db = require('../config/db');

// Tipos de busca aceitos. Cada tipo diz qual coluna consultar e se a comparação é exata.
// Esta tabela é a única fonte dos nomes de coluna usados na consulta de busca.
const TIPOS_DE_BUSCA = {
    nome: { coluna: 'nome', exata: false },
    categoria: { coluna: 'categoria', exata: false },
    numeracao: { coluna: 'numeracao', exata: true } // Numeração precisa ser exata (ex: 41)
};

// Limite de tamanho dos campos de texto. Evita que um pedido grave megabytes na base.
const MAX_TEXTO = 200;

// Marca o erro como falha de validação. O controller usa essa marca para responder 400.
// A propriedade 'erros' carrega a lista completa, para o cliente corrigir tudo de uma vez.
const erroDeValidacao = (mensagem, erros) => {
    const erro = new Error(mensagem);
    erro.validacao = true;
    if (erros) erro.erros = erros;
    return erro;
};

// Confere um produto que chegou pelo POST. Devolve a lista de problemas encontrados.
// Uma lista vazia significa que o produto pode ser gravado.
const validarProduto = (produto) => {
    const erros = [];

    if (produto === null || typeof produto !== 'object' || Array.isArray(produto)) {
        return ['O corpo do pedido precisa ser um objeto JSON.'];
    }

    for (const campo of ['nome', 'categoria', 'status_estoque', 'numeracao']) {
        const valor = produto[campo];
        if (typeof valor !== 'string' || valor.trim() === '') {
            erros.push(`O campo "${campo}" é obrigatório e precisa ser um texto.`);
        } else if (valor.length > MAX_TEXTO) {
            erros.push(`O campo "${campo}" passa de ${MAX_TEXTO} caracteres.`);
        }
    }

    const quantidade = produto.quantidade;
    if (!Number.isInteger(quantidade)) {
        erros.push('O campo "quantidade" é obrigatório e precisa ser um número inteiro.');
    } else if (quantidade < 0) {
        erros.push('O campo "quantidade" não pode ser negativo.');
    }

    return erros;
};

const ProdutoModel = {
    // 1. Função que lista tudo
    listarTodos: (callback) => {
        db.all('SELECT * FROM produtos', [], callback);
    },

    // 2.Função que adiciona um produto
    adicionar: (produto, callback) => {
        // A validação vem antes do banco. Sem ela, o controller repassava req.body direto
        // e qualquer pedido gravava uma linha, inclusive com campos nulos ou tipos errados.
        const erros = validarProduto(produto);
        if (erros.length > 0) {
            return callback(erroDeValidacao('O produto enviado não passou na validação.', erros));
        }

        const sql =
            'INSERT INTO produtos (nome, categoria, quantidade, status_estoque, numeracao) VALUES (?, ?, ?, ?, ?)';
        // O trim evita repetir o problema dos espaços sobrando que havia no banco antigo.
        const valores = [
            produto.nome.trim(),
            produto.categoria.trim(),
            produto.quantidade,
            produto.status_estoque.trim(),
            produto.numeracao.trim()
        ];

        // db.run usado para modificar o banco (inserir, atualizar, apagar)
        db.run(sql, valores, callback);
    },

    // 3. Função: Pesquisar por nome, categoria ou numeração
    buscar: (termo, tipo, callback) => {
        // hasOwnProperty evita que nomes herdados de Object, como 'constructor',
        // passem por tipo válido.
        const tipoValido =
            typeof tipo === 'string' && Object.prototype.hasOwnProperty.call(TIPOS_DE_BUSCA, tipo);

        // Sem um tipo válido não existe consulta para montar. Esta função antes deixava
        // a consulta vazia e chamava db.all(''), e o driver sqlite3 derrubava o processo
        // com segmentation fault. Nunca monte a consulta fora desta tabela.
        if (!tipoValido) {
            const aceitos = Object.keys(TIPOS_DE_BUSCA).join(', ');
            return callback(
                erroDeValidacao(
                    `O parâmetro "tipo" é obrigatório e precisa ser um destes: ${aceitos}.`
                )
            );
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
