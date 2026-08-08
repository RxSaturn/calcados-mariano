// Unidades da loja onde um par pode estar.
//
// Este arquivo não abre conexão com o banco de propósito. O db/setup.js precisa da
// lista durante a migração, e importar um model traria junto src/config/db.js, que
// abriria uma segunda conexão com o arquivo do banco.
//
// Para incluir uma unidade nova, acrescente o nome aqui e rode npm run db:setup. A
// migração cria a linha que falta com saldo zero, sem tocar no saldo das outras.
const UNIDADES = ['Matriz', 'Filial'];

// Unidade que recebe o saldo quando o pedido não diz qual. Ela também recebe todo o
// saldo antigo na migração, porque o banco anterior guardava um número só e não
// dizia de qual loja ele era.
const UNIDADE_PADRAO = UNIDADES[0];

module.exports = { UNIDADES, UNIDADE_PADRAO };
