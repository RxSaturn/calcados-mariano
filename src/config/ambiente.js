const fs = require('fs');
const path = require('path');

/**
 * Carrega o arquivo `.env` da raiz do projeto.
 *
 * **Por que precisa existir.** O `.env.example` manda copiar o arquivo para
 * `.env`, e o código lê `process.env.ADMIN_SENHA_HASH` e `process.env.SESSAO_SEGREDO`.
 * Faltava a peça do meio: ninguém carregava o arquivo. Quem seguia o roteiro do
 * repositório à risca terminava com um `.env` correto e um login respondendo
 * 503, sem nada apontando para a causa.
 *
 * Sem dependência nova. O Node 20.12 em diante traz `process.loadEnvFile`, e o
 * projeto já exige o 22. Uma biblioteca para ler um arquivo de pares
 * `chave=valor` não se paga.
 *
 * O que já está no ambiente vence o arquivo. É o que permite subir com outra
 * porta ou outro banco sem editar nada, e é como os testes e a CI passam os
 * valores deles.
 */
function carregarAmbiente() {
    /*
     * Em teste, não. O `.env` pertence a uma instalação de verdade, e um teste
     * que o lê passa ou falha conforme a máquina onde roda: verde na CI, que
     * não tem o arquivo, e vermelho justamente na máquina de quem instalou o
     * sistema. Os testes declaram o próprio ambiente, e é assim que eles
     * conseguem exercitar o caso de "autenticação não configurada".
     */
    if (process.env.NODE_ENV === 'test') return false;

    const arquivo = path.resolve(__dirname, '..', '..', '.env');
    if (!fs.existsSync(arquivo)) return false;

    try {
        process.loadEnvFile(arquivo);
        return true;
    } catch (erro) {
        // Um `.env` ilegível não pode derrubar o servidor calado: o processo
        // continua com o que houver no ambiente, mas o motivo fica no registro.
        console.warn(`Não consegui ler o arquivo .env: ${erro.message}`);
        return false;
    }
}

module.exports = { carregarAmbiente };
