#!/usr/bin/env node
/**
 * Instala o sistema na máquina da loja, do zero até rodando.
 *
 *     npm run instalar
 *
 * **Por que existe.** O roteiro anterior tinha sete passos em dois terminais, e
 * três deles falhavam calados. Sem `ADMIN_SENHA_HASH` o painel sobe bonito e
 * recusa todo cadastro com 503 — quem instala descobre isso no dia seguinte,
 * quando o dono da loja tenta usar. Sem compilar o front, o servidor entrega a
 * API e nenhuma tela. Ordem errada entre banco e servidor dá um erro que fala
 * de outra coisa.
 *
 * Aqui a ordem é do programa, e ele para no primeiro passo que falhar.
 */

const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { gerarHashDeSenha } = require('../src/auth/sessao');

const RAIZ = path.resolve(__dirname, '..');
const NODE_MINIMO = 22;
const SENHA_MINIMA = 10;

const cor = {
    ok: (t) => `\x1b[32m${t}\x1b[0m`,
    erro: (t) => `\x1b[31m${t}\x1b[0m`,
    fraco: (t) => `\x1b[2m${t}\x1b[0m`
};

let passoAtual = 0;
function passo(texto) {
    passoAtual += 1;
    console.log(`\n${cor.fraco(`[${passoAtual}/6]`)} ${texto}`);
}

function rodar(comando, argumentos, pasta = RAIZ) {
    execFileSync(comando, argumentos, {
        cwd: pasta,
        stdio: 'inherit',
        shell: process.platform === 'win32'
    });
}

function perguntar(rl, texto, padrao) {
    const sufixo = padrao ? cor.fraco(` [${padrao}]`) : '';
    return new Promise((resolve) =>
        rl.question(`${texto}${sufixo}: `, (r) => resolve(r.trim() || padrao || ''))
    );
}

/**
 * Lê a senha sem mostrar na tela.
 *
 * Instalação de loja acontece com gente em volta, e a senha do painel é a única
 * credencial do sistema. Ecoar no terminal a deixa no histórico da sessão e à
 * vista de quem estiver olhando.
 */
function perguntarSenha(texto) {
    return new Promise((resolve) => {
        const entrada = process.stdin;
        const tinhaModoBruto = entrada.isTTY;
        process.stdout.write(`${texto}: `);
        if (tinhaModoBruto) entrada.setRawMode(true);
        entrada.resume();
        entrada.setEncoding('utf8');

        let senha = '';
        const aoDigitar = (tecla) => {
            if (tecla === '\r' || tecla === '\n' || tecla === '\u0004') {
                if (tinhaModoBruto) entrada.setRawMode(false);
                entrada.removeListener('data', aoDigitar);
                entrada.pause();
                process.stdout.write('\n');
                return resolve(senha);
            }
            if (tecla === '\u0003') {
                // Ctrl+C precisa continuar encerrando, mesmo em modo bruto.
                if (tinhaModoBruto) entrada.setRawMode(false);
                process.stdout.write('\n');
                process.exit(1);
            }
            if (tecla === '\u007f' || tecla === '\b') {
                senha = senha.slice(0, -1);
                return;
            }
            senha += tecla;
        };
        entrada.on('data', aoDigitar);
    });
}

function conferirNode() {
    passo('Conferindo o Node.js');
    const versao = Number(process.versions.node.split('.')[0]);
    if (versao < NODE_MINIMO) {
        console.error(
            cor.erro(
                `\nEste sistema precisa do Node ${NODE_MINIMO} ou mais novo. ` +
                    `Esta máquina tem o ${process.versions.node}.\n`
            )
        );
        console.error('Baixe em https://nodejs.org e rode a instalação de novo.\n');
        process.exit(1);
    }
    console.log(`${cor.ok('✓')} Node ${process.versions.node}`);
}

function instalarDependencias() {
    passo('Instalando as dependências');
    // `npm ci` respeita o package-lock. `npm install` resolveria versões novas na
    // máquina do cliente, e a instalação deixaria de ser igual à que foi testada.
    rodar('npm', ['ci']);
    // O `--include=dev` é obrigatório: as ferramentas de compilação do front são
    // devDependencies, e com NODE_ENV=production o npm as pula.
    rodar('npm', ['ci', '--include=dev'], path.join(RAIZ, 'web'));
    console.log(`${cor.ok('✓')} dependências dos dois lados`);
}

async function prepararConfiguracao() {
    passo('Preparando a configuração');

    const destino = path.join(RAIZ, '.env');
    if (fs.existsSync(destino)) {
        const conteudo = fs.readFileSync(destino, 'utf8');
        const temSenha = /^ADMIN_SENHA_HASH=.+$/m.test(conteudo);
        if (temSenha) {
            console.log(`${cor.ok('✓')} .env já existe ${cor.fraco('(mantido como está)')}`);
            return;
        }
        console.log(cor.fraco('  .env existe mas está sem senha de painel. Vou completar.'));
    }

    /*
     * As respostas podem vir do ambiente. Isso serve para instalar sem ninguém
     * na frente do terminal, e é o que permite exercitar a instalação inteira
     * num teste — uma instalação que só funciona com gente digitando não tem
     * como ser verificada antes de chegar na loja.
     */
    const semPergunta = Boolean(process.env.INSTALAR_SENHA);
    let porta = process.env.INSTALAR_PORTA || '3000';

    if (!semPergunta) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        console.log(cor.fraco('\nResponda com Enter para aceitar o valor entre colchetes.\n'));
        porta = await perguntar(rl, 'Porta do sistema', '3000');
        rl.close();
    }

    console.log(
        cor.fraco(
            '\nAgora a senha do painel de estoque. É ela que o dono da loja usa\n' +
                'para cadastrar e editar produtos. Ela não aparece enquanto você digita.\n'
        )
    );

    let senha = process.env.INSTALAR_SENHA || '';
    if (senha && senha.length < SENHA_MINIMA) {
        console.error(
            cor.erro(
                `\nINSTALAR_SENHA tem ${senha.length} caracteres. Use pelo menos ${SENHA_MINIMA}.\n`
            )
        );
        process.exit(1);
    }
    while (!senha) {
        senha = await perguntarSenha(`Senha do painel (mínimo ${SENHA_MINIMA} caracteres)`);
        if (senha.length < SENHA_MINIMA) {
            console.log(
                cor.erro(`  são ${senha.length} caracteres. Use pelo menos ${SENHA_MINIMA}.`)
            );
            continue;
        }
        const repetida = await perguntarSenha('Digite de novo para conferir');
        if (repetida !== senha) {
            console.log(cor.erro('  as duas não são iguais. Vamos de novo.'));
            continue;
        }
        break;
    }

    const linhas = [
        `PORT=${porta}`,
        '',
        '# Senha do painel, guardada como hash. A senha em texto não fica em lugar nenhum.',
        `ADMIN_SENHA_HASH=${gerarHashDeSenha(senha)}`,
        '',
        '# Assina os cookies de sessão. Trocar esta chave derruba quem estiver logado.',
        `SESSAO_SEGREDO=${crypto.randomBytes(32).toString('hex')}`,
        '',
        '# Só é usado quando a interface é servida de outro endereço. Na máquina da',
        '# loja fica em branco: o mesmo servidor entrega as telas e a API.',
        'CORS_ORIGINS=',
        ''
    ].join('\n');

    // 0o600: só o dono do arquivo lê. Aqui dentro estão o hash da senha e a
    // chave que assina as sessões.
    fs.writeFileSync(destino, linhas, { mode: 0o600 });
    console.log(`${cor.ok('✓')} .env criado ${cor.fraco('(só o dono do arquivo consegue ler)')}`);
}

function prepararBanco() {
    passo('Preparando o banco de dados');
    rodar('npm', ['run', 'db:setup']);
    console.log(`${cor.ok('✓')} banco pronto`);
}

function compilarInterface() {
    passo('Compilando as telas');
    rodar('npm', ['run', 'build'], path.join(RAIZ, 'web'));
    console.log(`${cor.ok('✓')} vitrine e painel compilados`);
}

function conferirResultado() {
    passo('Conferindo');
    const faltando = [
        [path.join(RAIZ, '.env'), 'arquivo de configuração'],
        [path.join(RAIZ, 'web', 'dist', 'index.html'), 'telas compiladas'],
        [process.env.DB_PATH || path.join(RAIZ, 'calcados_mariano.db'), 'banco de dados']
    ].filter(([caminho]) => !fs.existsSync(caminho));

    if (faltando.length > 0) {
        console.error(cor.erro('\nA instalação terminou sem produzir:'));
        for (const [, nome] of faltando) console.error(`  - ${nome}`);
        process.exit(1);
    }
    console.log(`${cor.ok('✓')} tudo no lugar`);
}

async function main() {
    console.log('\nInstalação do sistema da Calçados Mariano\n');
    conferirNode();
    instalarDependencias();
    await prepararConfiguracao();
    prepararBanco();
    compilarInterface();
    conferirResultado();

    const porta = process.env.PORT || '3000';
    console.log(`\n${cor.ok('Pronto.')} Para subir o sistema:\n`);
    console.log('  npm start\n');
    console.log(`Depois abra no navegador:\n`);
    console.log(`  http://localhost:${porta}         a vitrine`);
    console.log(`  http://localhost:${porta}/admin   o painel de estoque\n`);
}

main().catch((erro) => {
    console.error(cor.erro(`\nA instalação parou: ${erro.message}\n`));
    process.exit(1);
});
