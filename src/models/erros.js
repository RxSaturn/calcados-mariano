// Marcas que os models põem no erro para o controller escolher o código HTTP.
//
// O model não conhece HTTP, e o controller não conhece SQL. Estas duas marcas são o
// contrato entre os dois. Sem elas, o controller teria de ler a mensagem de erro para
// decidir entre 400, 404 e 500, e uma mudança de texto quebraria o código.

// Falha de validação. O controller responde 400.
// A propriedade 'erros' carrega a lista completa, para o cliente corrigir tudo de uma vez.
const erroDeValidacao = (mensagem, erros) => {
    const erro = new Error(mensagem);
    erro.validacao = true;
    if (erros) erro.erros = erros;
    return erro;
};

// Recurso ausente. O controller responde 404.
const erroNaoEncontrado = (mensagem) => {
    const erro = new Error(mensagem);
    erro.naoEncontrado = true;
    return erro;
};

module.exports = { erroDeValidacao, erroNaoEncontrado };
