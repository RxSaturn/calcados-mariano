#!/usr/bin/env node
/**
 * Cópia de segurança do banco.
 *
 *     npm run backup
 *
 * **Por que é obrigatório.** O estoque inteiro da loja vive num arquivo só,
 * num computador de loja. Um disco que morre, um arquivo apagado sem querer, e
 * o cadastro de todos os calçados vai junto — e ninguém reconstrói isso de
 * memória. Este é o único risco do sistema que não tem conserto depois.
 *
 * **Por que `VACUUM INTO`, e não copiar o arquivo.** Copiar um banco SQLite
 * enquanto alguém escreve nele produz um arquivo que parece bom e está pela
 * metade: o SQLite grava em páginas, e a cópia pode pegar uma escrita no meio.
 * O `VACUUM INTO` é feito pelo próprio SQLite, sai consistente mesmo com o
 * sistema em uso, e ainda vem compactado, sem as páginas livres.
 *
 * A cópia sai como um banco pronto para uso. Restaurar é fechar o sistema,
 * trocar o arquivo e abrir de novo — sem descompactar, sem comando de banco.
 */

require('../src/config/ambiente').carregarAmbiente();

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const RAIZ = path.resolve(__dirname, '..');
const BANCO = process.env.DB_PATH || path.join(RAIZ, 'calcados_mariano.db');
const PASTA = process.env.BACKUP_PASTA || path.join(RAIZ, 'backups');
const MANTER = Number(process.env.BACKUP_MANTER) || 14;

const cor = {
    ok: (t) => `\x1b[32m${t}\x1b[0m`,
    erro: (t) => `\x1b[31m${t}\x1b[0m`,
    fraco: (t) => `\x1b[2m${t}\x1b[0m`
};

/** Carimbo em hora local, que é a que a pessoa da loja lê no relógio da parede. */
function carimbo() {
    const agora = new Date();
    const dois = (n) => String(n).padStart(2, '0');
    return (
        `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}` +
        `-${dois(agora.getHours())}${dois(agora.getMinutes())}`
    );
}

function legivel(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Conta os produtos de um banco. É o que diz se a cópia tem o que devia ter. */
function contarProdutos(caminho) {
    return new Promise((resolve, reject) => {
        const banco = new sqlite3.Database(caminho, sqlite3.OPEN_READONLY, (erro) => {
            if (erro) return reject(erro);
            banco.get('SELECT COUNT(*) AS total FROM produtos', (falha, linha) => {
                banco.close();
                if (falha) return reject(falha);
                resolve(linha.total);
            });
        });
    });
}

function copiar(destino) {
    return new Promise((resolve, reject) => {
        // Somente leitura: a cópia não pode ser o motivo de uma escrita no banco
        // de produção.
        const banco = new sqlite3.Database(BANCO, sqlite3.OPEN_READONLY, (erro) => {
            if (erro) return reject(erro);
            // O caminho vai entre aspas simples duplicadas, porque `VACUUM INTO`
            // não aceita parâmetro. O valor vem do ambiente, não de um pedido
            // pela rede, mas escapar é barato e o descuido aqui viraria injeção.
            const alvo = destino.replace(/'/g, "''");
            banco.run(`VACUUM INTO '${alvo}'`, (falha) => {
                banco.close();
                if (falha) return reject(falha);
                resolve();
            });
        });
    });
}

/**
 * Apaga as cópias mais velhas, mantendo as últimas.
 *
 * Sem isto a pasta cresce para sempre e, num disco de loja, o dia em que ela
 * enche é o dia em que o sistema para de gravar ponto — a proteção virando o
 * problema.
 */
function rotacionar() {
    const copias = fs
        .readdirSync(PASTA)
        .filter((nome) => /^estoque-.*\.db$/.test(nome))
        .sort()
        .reverse();

    const sobrando = copias.slice(MANTER);
    for (const nome of sobrando) fs.unlinkSync(path.join(PASTA, nome));
    return { total: copias.length - sobrando.length, apagadas: sobrando.length };
}

/**
 * Confere a cópia abrindo ela, e não olhando o tamanho.
 *
 * Tamanho engana: um banco vazio produz um arquivo de 4096 bytes, que parece
 * plausível e não tem produto nenhum. O que importa é se os produtos estão lá,
 * e a única forma de saber é perguntar ao arquivo que acabou de ser escrito.
 *
 * Uma cópia que não confere é apagada. Guardar uma cópia ruim é pior que não
 * ter cópia: quem a vê na pasta acredita estar protegido.
 */
async function conferir(destino) {
    let naCopia;
    let noBanco;
    try {
        noBanco = await contarProdutos(BANCO);
        naCopia = await contarProdutos(destino);
    } catch (erro) {
        fs.unlinkSync(destino);
        throw new Error(`A cópia saiu ilegível e foi descartada: ${erro.message}`);
    }

    if (naCopia !== noBanco) {
        fs.unlinkSync(destino);
        throw new Error(
            `A cópia tem ${naCopia} produto(s) e o banco tem ${noBanco}. ` + 'Nada foi guardado.'
        );
    }
    return noBanco;
}

async function main() {
    if (!fs.existsSync(BANCO)) {
        console.error(cor.erro(`\nNão encontrei o banco em ${BANCO}.`));
        console.error('Rode `npm run db:setup` antes, ou confira DB_PATH no .env.\n');
        process.exit(1);
    }

    fs.mkdirSync(PASTA, { recursive: true });
    const destino = path.join(PASTA, `estoque-${carimbo()}.db`);

    if (fs.existsSync(destino)) {
        // Duas cópias no mesmo minuto: a segunda não tem o que acrescentar, e
        // sobrescrever apagaria a primeira sem motivo. A rotação continua
        // acontecendo depois, senão um dia com duas execuções deixaria a pasta
        // crescendo sem ninguém notar.
        console.log(
            `${cor.ok('✓')} já existe uma cópia deste minuto ${cor.fraco(path.basename(destino))}`
        );
    } else {
        await copiar(destino);
        await conferir(destino);
    }

    const { total, apagadas } = rotacionar();
    const tamanho = fs.statSync(destino).size;
    console.log(`${cor.ok('✓')} ${path.basename(destino)} ${cor.fraco(`(${legivel(tamanho)})`)}`);
    console.log(cor.fraco(`  ${total} cópia(s) guardada(s) em ${PASTA}`));
    if (apagadas > 0) {
        console.log(
            cor.fraco(`  ${apagadas} cópia(s) antiga(s) apagada(s), mantendo as ${MANTER} últimas`)
        );
    }
}

main().catch((erro) => {
    console.error(cor.erro(`\nA cópia de segurança falhou: ${erro.message}\n`));
    process.exit(1);
});
