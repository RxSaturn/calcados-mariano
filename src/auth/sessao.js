const crypto = require('crypto');

// Sessão do painel, sem dependência nova.
//
// O token é um par "dados.assinatura", com a assinatura em HMAC-SHA256. O cookie é
// escrito e lido na mão. Uma biblioteca de sessão não se paga para um credencial só.
//
// A senha do dono NÃO fica no código. Ela vive em ADMIN_SENHA_HASH, no formato
// scrypt, gerado por "npm run auth:hash". Sem essa variável, o login recusa tudo.

const NOME_COOKIE = 'sessao_mariano';
const DURACAO_HORAS = 12;

// scrypt com sal por senha. O formato guardado é "scrypt$<sal>$<hash>", em hexadecimal.
const PREFIXO_SCRYPT = 'scrypt';
const TAMANHO_SAL = 16;
const TAMANHO_HASH = 64;

const gerarHashDeSenha = (senha) => {
    const sal = crypto.randomBytes(TAMANHO_SAL);
    const hash = crypto.scryptSync(senha, sal, TAMANHO_HASH);
    return `${PREFIXO_SCRYPT}$${sal.toString('hex')}$${hash.toString('hex')}`;
};

const senhaConfere = (senha, guardado) => {
    if (typeof senha !== 'string' || typeof guardado !== 'string') return false;

    const partes = guardado.split('$');
    if (partes.length !== 3 || partes[0] !== PREFIXO_SCRYPT) return false;

    let sal;
    let esperado;
    try {
        sal = Buffer.from(partes[1], 'hex');
        esperado = Buffer.from(partes[2], 'hex');
    } catch {
        return false;
    }
    if (sal.length === 0 || esperado.length !== TAMANHO_HASH) return false;

    const calculado = crypto.scryptSync(senha, sal, TAMANHO_HASH);
    // timingSafeEqual evita que o tempo de resposta revele quantos bytes casaram.
    return crypto.timingSafeEqual(calculado, esperado);
};

// Diz se o servidor tem como autenticar. Sem as duas variáveis, o login responde 503 em
// vez de aceitar qualquer senha. Nunca existe credencial padrão.
const autenticacaoConfigurada = () =>
    Boolean(process.env.ADMIN_SENHA_HASH) && Boolean(process.env.SESSAO_SEGREDO);

const assinar = (dados) =>
    crypto.createHmac('sha256', process.env.SESSAO_SEGREDO).update(dados).digest('base64url');

const criarToken = () => {
    const expiraEm = Date.now() + DURACAO_HORAS * 60 * 60 * 1000;
    const dados = Buffer.from(JSON.stringify({ dono: true, expiraEm })).toString('base64url');
    return `${dados}.${assinar(dados)}`;
};

const tokenValido = (token) => {
    if (typeof token !== 'string' || !token.includes('.')) return false;

    const [dados, assinatura] = token.split('.');
    if (!dados || !assinatura) return false;

    const esperada = Buffer.from(assinar(dados));
    const recebida = Buffer.from(assinatura);
    if (esperada.length !== recebida.length) return false;
    if (!crypto.timingSafeEqual(esperada, recebida)) return false;

    try {
        const conteudo = JSON.parse(Buffer.from(dados, 'base64url').toString('utf8'));
        return conteudo.dono === true && typeof conteudo.expiraEm === 'number'
            ? conteudo.expiraEm > Date.now()
            : false;
    } catch {
        return false;
    }
};

// Lê um cookie do cabeçalho, sem cookie-parser. Só precisamos de um nome.
const lerCookie = (req, nome) => {
    const cabecalho = req.headers?.cookie;
    if (typeof cabecalho !== 'string') return undefined;

    for (const parte of cabecalho.split(';')) {
        const separador = parte.indexOf('=');
        if (separador === -1) continue;
        if (parte.slice(0, separador).trim() === nome) {
            return decodeURIComponent(parte.slice(separador + 1).trim());
        }
    }
    return undefined;
};

const gravarCookieDeSessao = (res, token) => {
    // httpOnly impede que script na página leia o token, o que limita o dano de um XSS.
    // Em produção, secure exige HTTPS.
    const atributos = [
        `${NOME_COOKIE}=${encodeURIComponent(token)}`,
        'HttpOnly',
        'SameSite=Lax',
        'Path=/',
        `Max-Age=${DURACAO_HORAS * 60 * 60}`
    ];
    if (process.env.NODE_ENV === 'production') atributos.push('Secure');
    res.setHeader('Set-Cookie', atributos.join('; '));
};

const limparCookieDeSessao = (res) => {
    res.setHeader('Set-Cookie', `${NOME_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
};

const temSessao = (req) => autenticacaoConfigurada() && tokenValido(lerCookie(req, NOME_COOKIE));

module.exports = {
    NOME_COOKIE,
    autenticacaoConfigurada,
    gerarHashDeSenha,
    senhaConfere,
    criarToken,
    tokenValido,
    lerCookie,
    gravarCookieDeSessao,
    limparCookieDeSessao,
    temSessao
};
