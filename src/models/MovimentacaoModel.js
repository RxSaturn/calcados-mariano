// Entrada e saída de estoque.
//
// Esta é a ÚNICA porta por onde o saldo muda. O PUT do produto edita nome, categoria,
// público, numeração, marca, cor, descrição e imagem, e não toca na quantidade. Se ele
// tocasse, o saldo mudaria sem deixar rastro, e o histórico teria furo justamente no
// caso que interessa: alguém que corrige um número à mão.
//
// A movimentação e o recálculo do total acontecem na mesma transação. Ou as duas
// coisas valem, ou nenhuma vale.

const { executar, umaLinha, linhas, emTransacao } = require('./transacao');
const EstoqueModel = require('./EstoqueModel');
const { erroDeValidacao, erroNaoEncontrado } = require('./erros');

const TIPOS = ['entrada', 'saida'];

const MAX_MOTIVO = 200;
const LIMITE_PADRAO = 50;
const LIMITE_MAXIMO = 100;

const MOTIVO_CADASTRO = 'Cadastro inicial';

const idValido = (id) => /^[1-9][0-9]*$/.test(String(id));

// Confere o corpo de uma movimentação e devolve a lista de problemas.
const validar = (dados) => {
    if (dados === null || typeof dados !== 'object' || Array.isArray(dados)) {
        return ['O corpo do pedido precisa ser um objeto JSON.'];
    }

    const erros = [];

    if (!EstoqueModel.unidadeValida(dados.unidade)) {
        erros.push(`O campo "unidade" precisa ser um destes: ${EstoqueModel.UNIDADES.join(', ')}.`);
    }

    if (typeof dados.tipo !== 'string' || !TIPOS.includes(dados.tipo)) {
        erros.push(`O campo "tipo" precisa ser um destes: ${TIPOS.join(', ')}.`);
    }

    // Zero não é movimentação, e negativo seria uma saída disfarçada de entrada. O tipo
    // é que dá o sinal, e a quantidade é sempre positiva.
    if (!Number.isInteger(dados.quantidade) || dados.quantidade < 1) {
        erros.push('O campo "quantidade" precisa ser um número inteiro a partir de 1.');
    }

    const motivo = dados.motivo;
    if (motivo !== undefined && motivo !== null && motivo !== '') {
        if (typeof motivo !== 'string') {
            erros.push('O campo "motivo" precisa ser um texto.');
        } else if (motivo.trim().length > MAX_MOTIVO) {
            erros.push(`O campo "motivo" passa de ${MAX_MOTIVO} caracteres.`);
        }
    }

    return erros;
};

// Grava a movimentação e acerta o saldo. Roda dentro de uma transação já aberta.
const gravar = async (produtoId, { unidade, tipo, quantidade, motivo }) => {
    const produto = await umaLinha('SELECT id FROM produtos WHERE id = ?', [produtoId]);
    if (!produto) throw erroNaoEncontrado('Produto não encontrado.');

    await EstoqueModel.garantirLinhas(produtoId);

    const saldo = await EstoqueModel.saldoDaUnidade(produtoId, unidade);

    // A regra que impede saldo negativo. Ela fica aqui, dentro da transação e depois
    // do BEGIN IMMEDIATE, e não no controller: entre a leitura do saldo e a escrita
    // não pode caber outra movimentação.
    if (tipo === 'saida' && quantidade > saldo) {
        throw erroDeValidacao('A saída é maior que o saldo da unidade.', [
            `A ${unidade} tem ${saldo} em estoque, e a saída pedida é de ${quantidade}.`
        ]);
    }

    const delta = tipo === 'entrada' ? quantidade : -quantidade;
    await EstoqueModel.aplicarDelta(produtoId, unidade, delta);

    const { lastID } = await executar(
        `INSERT INTO movimentacoes (produto_id, unidade, tipo, quantidade, motivo, criado_em)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [produtoId, unidade, tipo, quantidade, motivo || null, new Date().toISOString()]
    );

    await EstoqueModel.recalcularTotal(produtoId);

    return { id: lastID, produto_id: produtoId, unidade, tipo, quantidade, saldo: saldo + delta };
};

const MovimentacaoModel = {
    TIPOS,
    MOTIVO_CADASTRO,
    gravar,

    // POST /produtos/:id/movimentacoes
    registrar: (id, dados, callback) => {
        if (!idValido(id)) {
            return callback(erroDeValidacao('O id precisa ser um número inteiro a partir de 1.'));
        }

        const erros = validar(dados);
        if (erros.length > 0) {
            return callback(
                erroDeValidacao('A movimentação enviada não passou na validação.', erros)
            );
        }

        emTransacao(() =>
            gravar(Number(id), {
                unidade: dados.unidade.trim(),
                tipo: dados.tipo,
                quantidade: dados.quantidade,
                motivo: typeof dados.motivo === 'string' ? dados.motivo.trim() : null
            })
        )
            .then((resultado) => callback(null, resultado))
            .catch(callback);
    },

    // GET /produtos/:id/movimentacoes, do mais recente para o mais antigo.
    listar: (id, filtros, callback) => {
        if (!idValido(id)) {
            return callback(erroDeValidacao('O id precisa ser um número inteiro a partir de 1.'));
        }

        const erros = [];
        const inteiro = (valor, nome, padrao, maximo) => {
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

        const pagina = inteiro((filtros || {}).pagina, 'pagina', 1);
        const limite = inteiro((filtros || {}).limite, 'limite', LIMITE_PADRAO, LIMITE_MAXIMO);

        if (erros.length > 0) {
            return callback(erroDeValidacao('Os parâmetros do histórico não passaram.', erros));
        }

        const produtoId = Number(id);

        umaLinha('SELECT id FROM produtos WHERE id = ?', [produtoId])
            .then((produto) => {
                if (!produto) throw erroNaoEncontrado('Produto não encontrado.');

                return Promise.all([
                    umaLinha('SELECT COUNT(*) AS total FROM movimentacoes WHERE produto_id = ?', [
                        produtoId
                    ]),
                    linhas(
                        `SELECT id, produto_id, unidade, tipo, quantidade, motivo, criado_em
                           FROM movimentacoes WHERE produto_id = ?
                          ORDER BY id DESC LIMIT ? OFFSET ?`,
                        [produtoId, limite, (pagina - 1) * limite]
                    )
                ]);
            })
            .then(([contagem, movimentacoes]) => {
                const total = contagem.total;
                callback(null, {
                    movimentacoes,
                    total,
                    pagina,
                    limite,
                    paginas: total === 0 ? 0 : Math.ceil(total / limite)
                });
            })
            .catch(callback);
    }
};

module.exports = MovimentacaoModel;
