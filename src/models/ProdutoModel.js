const db = require('../config/db');
const { executar, emTransacao } = require('./transacao');
const EstoqueModel = require('./EstoqueModel');
const MovimentacaoModel = require('./MovimentacaoModel');
const { erroDeValidacao, erroNaoEncontrado } = require('./erros');

// Tipos de busca aceitos. Cada tipo diz qual coluna consultar e se a comparação é exata.
// Esta tabela é a única fonte dos nomes de coluna usados na consulta de busca.
const TIPOS_DE_BUSCA = {
    nome: { coluna: 'nome', exata: false },
    categoria: { coluna: 'categoria', exata: false },
    numeracao: { coluna: 'numeracao', exata: true } // Numeração precisa ser exata (ex: 41)
};

// Públicos aceitos na coluna publico. A vitrine filtra por igualdade exata contra estes
// valores, portanto um valor fora da lista deixaria o produto invisível no filtro.
const PUBLICOS = ['Masculino', 'Feminino', 'Infantil', 'Unissex'];

// Ordenações aceitas. A chave vem do pedido, e o trecho SQL vem daqui. O nome da coluna
// nunca é montado com texto do cliente.
const ORDENACOES = {
    nome: 'nome_ordenacao ASC',
    nome_desc: 'nome_ordenacao DESC',
    quantidade: 'quantidade ASC',
    quantidade_desc: 'quantidade DESC',
    recentes: 'id DESC'
};

const ORDENACAO_PADRAO = 'nome';
const LIMITE_PADRAO = 50;
const LIMITE_MAXIMO = 100;

// Limite de tamanho dos campos de texto. Evita que um pedido grave megabytes na base.
const MAX_TEXTO = 200;
const MAX_DESCRICAO = 1000;
const MAX_URL = 500;

// Colunas que a escrita cobre. Antes desta lista, o INSERT gravava só 5 das 11 colunas,
// e um produto cadastrado pela API nascia com publico nulo. Ele então não aparecia em
// nenhum filtro de público da vitrine, e o dono da loja não tinha como perceber.
const COLUNAS_GRAVAVEIS = [
    'nome',
    'numeracao',
    'categoria',
    'publico',
    'quantidade',
    'status_estoque',
    'marca',
    'cor',
    'descricao',
    'imagem_url',
    'nome_ordenacao'
];

// Colunas que o PUT altera. É COLUNAS_GRAVAVEIS sem quantidade e sem status_estoque.
//
// O saldo saiu do caminho de edição de propósito. Ele muda só por movimentação, em
// POST /produtos/:id/movimentacoes, senão uma correção à mão trocaria o número sem
// deixar rastro e o histórico teria furo exatamente onde ele mais importa.
const COLUNAS_EDITAVEIS = COLUNAS_GRAVAVEIS.filter(
    (coluna) => coluna !== 'quantidade' && coluna !== 'status_estoque'
);

// Campos que o PUT recusa. O pedido responde 400 em vez de ignorar em silêncio: quem
// mandou uma quantidade nova espera que ela valha, e um sucesso calado faria a pessoa
// acreditar que o saldo mudou.
const CAMPOS_RECUSADOS_NA_EDICAO = ['quantidade', 'status_estoque'];

const temPropria = (objeto, chave) => Object.prototype.hasOwnProperty.call(objeto, chave);

// Tira acento e passa para minúscula. Serve só para ordenar.
//
// O SQLite não tem colação por idioma: COLLATE NOCASE dobra apenas ASCII. Sem isto,
// 'Sapatênis' viria depois de 'Sapato', porque o ponto de código de 'ê' é maior que o de
// 'o'. Em um catálogo em português quase todo nome tem acento.
const chaveDeOrdenacao = (texto) =>
    texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

// A vitrine põe este valor no atributo src de uma imagem. Sem esta checagem, um
// 'javascript:...' gravado no campo viraria execução de script na página do cliente.
const imagemUrlAceita = (valor) =>
    valor.startsWith('/') || valor.startsWith('http://') || valor.startsWith('https://');

const textoLimpo = (valor) => (typeof valor === 'string' ? valor.trim() : valor);

// Confere um produto que chegou pelo POST ou pelo PUT.
// Devolve a lista de problemas. Uma lista vazia significa que o produto pode ser gravado.
//
// O POST e o PUT divergem no saldo, e só nisso. O POST pede quantidade, porque um
// cadastro sem saldo de abertura não diz quantos pares a loja tem. O PUT recusa
// quantidade, porque o saldo só muda por movimentação.
const validarProduto = (produto, { comQuantidade = true } = {}) => {
    if (produto === null || typeof produto !== 'object' || Array.isArray(produto)) {
        return ['O corpo do pedido precisa ser um objeto JSON.'];
    }

    const erros = [];

    for (const campo of ['nome', 'categoria', 'numeracao']) {
        const valor = produto[campo];
        if (typeof valor !== 'string' || valor.trim() === '') {
            erros.push(`O campo "${campo}" é obrigatório e precisa ser um texto.`);
        } else if (valor.trim().length > MAX_TEXTO) {
            erros.push(`O campo "${campo}" passa de ${MAX_TEXTO} caracteres.`);
        }
    }

    // O público define em qual filtro da vitrine o produto aparece.
    if (typeof produto.publico !== 'string' || !PUBLICOS.includes(produto.publico.trim())) {
        erros.push(
            `O campo "publico" é obrigatório e precisa ser um destes: ${PUBLICOS.join(', ')}.`
        );
    }

    if (comQuantidade) {
        if (!Number.isInteger(produto.quantidade)) {
            erros.push('O campo "quantidade" é obrigatório e precisa ser um número inteiro.');
        } else if (produto.quantidade < 0) {
            erros.push('O campo "quantidade" não pode ser negativo.');
        }

        // A unidade que recebe o saldo de abertura. Sem ela, o saldo vai para a padrão.
        if (produto.unidade !== undefined && !EstoqueModel.unidadeValida(produto.unidade)) {
            erros.push(
                `O campo "unidade" precisa ser um destes: ${EstoqueModel.UNIDADES.join(', ')}.`
            );
        }
    } else {
        for (const campo of CAMPOS_RECUSADOS_NA_EDICAO) {
            if (temPropria(produto, campo)) {
                erros.push(
                    `O campo "${campo}" não muda por esta rota. Use POST /produtos/:id/movimentacoes.`
                );
            }
        }
    }

    // Opcionais. Quando vêm, precisam ser texto dentro do limite.
    for (const [campo, limite] of [
        ['status_estoque', MAX_TEXTO],
        ['marca', MAX_TEXTO],
        ['cor', MAX_TEXTO],
        ['descricao', MAX_DESCRICAO],
        ['imagem_url', MAX_URL]
    ]) {
        const valor = produto[campo];
        if (valor === undefined || valor === null || valor === '') continue;
        if (typeof valor !== 'string') {
            erros.push(`O campo "${campo}" precisa ser um texto.`);
        } else if (valor.trim().length > limite) {
            erros.push(`O campo "${campo}" passa de ${limite} caracteres.`);
        }
    }

    const imagem = produto.imagem_url;
    if (typeof imagem === 'string' && imagem.trim() !== '' && !imagemUrlAceita(imagem.trim())) {
        erros.push('O campo "imagem_url" precisa começar com "/", "http://" ou "https://".');
    }

    return erros;
};

// Monta um objeto de coluna para valor, com trim e com o status derivado. As duas
// funções abaixo tiram daqui a lista na ordem que cada consulta precisa, portanto a
// ordem dos valores nunca sai de sincronia com a lista de colunas.
const valoresPorColuna = (produto) => {
    const quantidade = produto.quantidade;
    const status =
        typeof produto.status_estoque === 'string' && produto.status_estoque.trim() !== ''
            ? produto.status_estoque.trim()
            : quantidade > 0
              ? 'Em estoque'
              : 'Sem estoque';

    const opcional = (valor) => {
        const limpo = textoLimpo(valor);
        return limpo === undefined || limpo === '' ? null : limpo;
    };

    return {
        nome: produto.nome.trim(),
        numeracao: produto.numeracao.trim(),
        categoria: produto.categoria.trim(),
        publico: produto.publico.trim(),
        quantidade,
        status_estoque: status,
        marca: opcional(produto.marca),
        cor: opcional(produto.cor),
        descricao: opcional(produto.descricao),
        imagem_url: opcional(produto.imagem_url),
        nome_ordenacao: chaveDeOrdenacao(produto.nome.trim())
    };
};

const valoresNaOrdem = (produto, colunas) => {
    const valores = valoresPorColuna(produto);
    return colunas.map((coluna) => valores[coluna]);
};

// Confere os parâmetros de listagem e devolve a consulta já montada.
const montarListagem = (filtros) => {
    const erros = [];
    const condicoes = [];
    const parametros = [];

    const { publico, categoria } = filtros;

    if (publico !== undefined && publico !== '') {
        if (!PUBLICOS.includes(publico)) {
            erros.push(`O parâmetro "publico" precisa ser um destes: ${PUBLICOS.join(', ')}.`);
        } else {
            condicoes.push('publico = ?');
            parametros.push(publico);
        }
    }

    if (categoria !== undefined && categoria !== '') {
        condicoes.push('categoria = ?');
        parametros.push(categoria);
    }

    const chaveOrdenacao =
        filtros.ordenar === undefined || filtros.ordenar === ''
            ? ORDENACAO_PADRAO
            : filtros.ordenar;

    if (!temPropria(ORDENACOES, chaveOrdenacao)) {
        // Um valor fora da lista responde 400 em vez de cair no padrão em silêncio.
        // Cair no padrão faria a tela mostrar outra ordem sem avisar ninguém.
        erros.push(
            `O parâmetro "ordenar" precisa ser um destes: ${Object.keys(ORDENACOES).join(', ')}.`
        );
    }

    const inteiroPositivo = (valor, nome, padrao, maximo) => {
        if (valor === undefined || valor === '') return padrao;
        const numero = Number(valor);
        if (!Number.isInteger(numero) || numero < 1) {
            erros.push(`O parâmetro "${nome}" precisa ser um número inteiro a partir de 1.`);
            return padrao;
        }
        if (maximo !== undefined && numero > maximo) {
            erros.push(`O parâmetro "${nome}" não pode passar de ${maximo}.`);
            return padrao;
        }
        return numero;
    };

    const pagina = inteiroPositivo(filtros.pagina, 'pagina', 1);
    const limite = inteiroPositivo(filtros.limite, 'limite', LIMITE_PADRAO, LIMITE_MAXIMO);

    if (erros.length > 0) return { erros };

    const onde = condicoes.length > 0 ? ` WHERE ${condicoes.join(' AND ')}` : '';

    return {
        erros: [],
        pagina,
        limite,
        sqlTotal: `SELECT COUNT(*) AS total FROM produtos${onde}`,
        sqlPagina: `SELECT * FROM produtos${onde} ORDER BY ${ORDENACOES[chaveOrdenacao]} LIMIT ? OFFSET ?`,
        parametros,
        parametrosPagina: [...parametros, limite, (pagina - 1) * limite]
    };
};

// Confere que o id do caminho é um inteiro positivo. '3x' e '-1' não são.
const idValido = (id) => /^[1-9][0-9]*$/.test(String(id));

const ProdutoModel = {
    // 1. Lista com filtro, ordenação e paginação.
    listar: (filtros, callback) => {
        const consulta = montarListagem(filtros || {});

        if (consulta.erros.length > 0) {
            return callback(
                erroDeValidacao(
                    'Os parâmetros da listagem não passaram na validação.',
                    consulta.erros
                )
            );
        }

        db.get(consulta.sqlTotal, consulta.parametros, (erro, contagem) => {
            if (erro) return callback(erro);

            db.all(consulta.sqlPagina, consulta.parametrosPagina, (erro, produtos) => {
                if (erro) return callback(erro);

                const total = contagem.total;
                callback(null, {
                    produtos,
                    total,
                    pagina: consulta.pagina,
                    limite: consulta.limite,
                    paginas: total === 0 ? 0 : Math.ceil(total / consulta.limite)
                });
            });
        });
    },

    // 2. Um produto pelo id. A vitrine usa isto no modal e no link direto.
    porId: (id, callback) => {
        if (!idValido(id)) {
            return callback(erroDeValidacao('O id precisa ser um número inteiro a partir de 1.'));
        }

        db.get('SELECT * FROM produtos WHERE id = ?', [Number(id)], (erro, produto) => {
            if (erro) return callback(erro);
            if (!produto) return callback(erroNaoEncontrado('Produto não encontrado.'));
            callback(null, produto);
        });
    },

    // 3. Adiciona um produto, cobrindo as colunas todas.
    //
    // O cadastro abre o saldo na mesma transação: cria a linha de estoque de cada
    // unidade e grava a movimentação de entrada. Sem isso, o produto nasceria com
    // produtos.quantidade preenchida e nenhum saldo por unidade, e o painel mostraria
    // um total que nenhuma loja tem.
    adicionar: (produto, callback) => {
        // A validação vem antes do banco. Sem ela, o controller repassava req.body direto
        // e qualquer pedido gravava uma linha, inclusive com campos nulos ou tipos errados.
        const erros = validarProduto(produto);
        if (erros.length > 0) {
            return callback(erroDeValidacao('O produto enviado não passou na validação.', erros));
        }

        const marcadores = COLUNAS_GRAVAVEIS.map(() => '?').join(', ');
        const sql = `INSERT INTO produtos (${COLUNAS_GRAVAVEIS.join(', ')}) VALUES (${marcadores})`;

        const unidade =
            produto.unidade === undefined
                ? EstoqueModel.UNIDADE_PADRAO
                : String(produto.unidade).trim();
        const quantidade = produto.quantidade;

        emTransacao(async () => {
            const { lastID } = await executar(sql, valoresNaOrdem(produto, COLUNAS_GRAVAVEIS));

            await EstoqueModel.garantirLinhas(lastID);

            // Um cadastro com saldo zero não gera movimentação, porque nada entrou.
            if (quantidade > 0) {
                await EstoqueModel.aplicarDelta(lastID, unidade, quantidade);
                await executar(
                    `INSERT INTO movimentacoes (produto_id, unidade, tipo, quantidade, motivo, criado_em)
                     VALUES (?, ?, 'entrada', ?, ?, ?)`,
                    [
                        lastID,
                        unidade,
                        quantidade,
                        MovimentacaoModel.MOTIVO_CADASTRO,
                        new Date().toISOString()
                    ]
                );
            }

            // O total não é recalculado aqui de propósito. O INSERT já gravou o mesmo
            // número em produtos.quantidade, e recalcular apagaria um status_estoque
            // que o cliente tenha enviado no cadastro.
            return { id: lastID };
        })
            .then((resultado) => callback(null, resultado))
            .catch(callback);
    },

    // 4. Substitui os atributos do produto. O painel usa isto para corrigir um cadastro.
    //
    // Esta rota NÃO altera a quantidade nem o status. Ver COLUNAS_EDITAVEIS.
    atualizar: (id, produto, callback) => {
        if (!idValido(id)) {
            return callback(erroDeValidacao('O id precisa ser um número inteiro a partir de 1.'));
        }

        const erros = validarProduto(produto, { comQuantidade: false });
        if (erros.length > 0) {
            return callback(erroDeValidacao('O produto enviado não passou na validação.', erros));
        }

        const atribuicoes = COLUNAS_EDITAVEIS.map((coluna) => `${coluna} = ?`).join(', ');
        const sql = `UPDATE produtos SET ${atribuicoes} WHERE id = ?`;

        db.run(sql, [...valoresNaOrdem(produto, COLUNAS_EDITAVEIS), Number(id)], function (erro) {
            if (erro) return callback(erro);
            if (this.changes === 0) return callback(erroNaoEncontrado('Produto não encontrado.'));
            callback(null, { id: Number(id) });
        });
    },

    // 5. Remove um produto.
    remover: (id, callback) => {
        if (!idValido(id)) {
            return callback(erroDeValidacao('O id precisa ser um número inteiro a partir de 1.'));
        }

        db.run('DELETE FROM produtos WHERE id = ?', [Number(id)], function (erro) {
            if (erro) return callback(erro);
            if (this.changes === 0) return callback(erroNaoEncontrado('Produto não encontrado.'));
            callback(null, { id: Number(id) });
        });
    },

    // 6. As opções de filtro, lidas do banco. A vitrine monta o menu com isto, em vez de
    // repetir uma lista fixa no código que sai de sincronia com os dados.
    opcoesDeFiltro: (callback) => {
        const distintos = (coluna) =>
            new Promise((ok, falha) => {
                const sql = `SELECT DISTINCT ${coluna} AS valor FROM produtos WHERE ${coluna} IS NOT NULL AND ${coluna} <> '' ORDER BY ${coluna} COLLATE NOCASE`;
                db.all(sql, [], (erro, linhas) =>
                    erro ? falha(erro) : ok(linhas.map((l) => l.valor))
                );
            });

        Promise.all([distintos('categoria'), distintos('publico')])
            .then(([categorias, publicos]) => callback(null, { categorias, publicos }))
            .catch(callback);
    },

    // 7. Pesquisar por nome, categoria ou numeração
    buscar: (termo, tipo, callback) => {
        // hasOwnProperty evita que nomes herdados de Object, como 'constructor',
        // passem por tipo válido.
        const tipoValido = typeof tipo === 'string' && temPropria(TIPOS_DE_BUSCA, tipo);

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
    },

    // Mantida para os testes e para quem só quer tudo, sem paginar.
    listarTodos: (callback) => {
        db.all('SELECT * FROM produtos ORDER BY id', [], callback);
    }
};

module.exports = ProdutoModel;
