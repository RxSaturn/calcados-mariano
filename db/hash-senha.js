// Gera o hash da senha do dono da loja, para pôr em ADMIN_SENHA_HASH no arquivo .env.
//
// Uso:
//   npm run auth:hash -- "a senha aqui"
//
// A senha em texto nunca entra no repositório e nunca vai para o banco. O que se guarda
// é o resultado do scrypt, com sal próprio, e ele não permite voltar à senha original.

const { gerarHashDeSenha } = require('../src/auth/sessao');
const crypto = require('crypto');

const senha = process.argv[2];

if (!senha) {
    console.error('Informe a senha. Exemplo:\n  npm run auth:hash -- "minha senha secreta"');
    process.exit(1);
}

if (senha.length < 10) {
    console.error(`A senha tem ${senha.length} caracteres. Use pelo menos 10.`);
    process.exit(1);
}

console.log('\nPonha estas duas linhas no seu arquivo .env, que não é versionado:\n');
console.log(`ADMIN_SENHA_HASH=${gerarHashDeSenha(senha)}`);
console.log(`SESSAO_SEGREDO=${crypto.randomBytes(32).toString('hex')}`);
console.log(
    '\nO SESSAO_SEGREDO assina os cookies de sessão. Trocá-lo derruba as sessões abertas.\n'
);
