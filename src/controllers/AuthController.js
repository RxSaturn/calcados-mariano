const {
    autenticacaoConfigurada,
    senhaConfere,
    criarToken,
    gravarCookieDeSessao,
    limparCookieDeSessao,
    temSessao
} = require('../auth/sessao');

const AuthController = {
    // Login do dono da loja. Um credencial só, guardado como hash em ADMIN_SENHA_HASH.
    entrar: (req, res) => {
        if (!autenticacaoConfigurada()) {
            return res.status(503).json({
                mensagem:
                    'A autenticação não está configurada neste servidor. Defina ADMIN_SENHA_HASH e SESSAO_SEGREDO.'
            });
        }

        const senha = req.body?.senha;

        if (typeof senha !== 'string' || senha === '') {
            return res.status(400).json({ mensagem: 'Informe a senha.' });
        }

        if (!senhaConfere(senha, process.env.ADMIN_SENHA_HASH)) {
            // A mensagem não diz se o problema foi o usuário ou a senha, porque existe um
            // usuário só. Também não conta tentativas: o limite de taxa é item do roadmap.
            return res.status(401).json({ mensagem: 'Senha incorreta.' });
        }

        gravarCookieDeSessao(res, criarToken());
        return res.status(200).json({ mensagem: 'Sessão iniciada.' });
    },

    sair: (req, res) => {
        limparCookieDeSessao(res);
        return res.status(200).json({ mensagem: 'Sessão encerrada.' });
    },

    // O painel chama isto ao abrir, para saber se mostra a tela ou o formulário de login.
    sessao: (req, res) =>
        res.status(200).json({
            autenticado: temSessao(req),
            configurada: autenticacaoConfigurada()
        })
};

module.exports = AuthController;
