const { gerarHashDeSenha } = require('../../src/auth/sessao');

// Configura a autenticação para os testes, sem senha fixa no código do repositório.
// A senha é sorteada a cada execução, e o hash é gerado na hora.
const SENHA_DE_TESTE = `teste-${Math.random().toString(36).slice(2)}-${Date.now()}`;

const configurarAutenticacao = () => {
    process.env.ADMIN_SENHA_HASH = gerarHashDeSenha(SENHA_DE_TESTE);
    process.env.SESSAO_SEGREDO = 'segredo-de-teste-nao-usar-em-producao';
    return SENHA_DE_TESTE;
};

const desconfigurarAutenticacao = () => {
    delete process.env.ADMIN_SENHA_HASH;
    delete process.env.SESSAO_SEGREDO;
};

// Faz login e devolve o valor do cabeçalho Cookie para os pedidos seguintes.
const obterCookie = async (request, app, senha) => {
    const resposta = await request(app).post('/auth/login').send({ senha });
    if (resposta.status !== 200) {
        throw new Error(`login falhou com ${resposta.status}: ${JSON.stringify(resposta.body)}`);
    }
    const enviados = resposta.headers['set-cookie'];
    return enviados.map((c) => c.split(';')[0]).join('; ');
};

module.exports = {
    SENHA_DE_TESTE,
    configurarAutenticacao,
    desconfigurarAutenticacao,
    obterCookie
};
