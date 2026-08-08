const { autenticacaoConfigurada, temSessao } = require('../auth/sessao');

// Guarda das rotas de escrita: POST, PUT e DELETE.
//
// As rotas de leitura ficam abertas de propósito, porque a vitrine é pública e o cliente
// não faz login para olhar calçados.
//
// Antes deste middleware, POST /produtos aceitava qualquer pedido. Com DELETE na API,
// isso passaria a permitir que alguém apagasse o estoque inteiro.
const exigirAutenticacao = (req, res, next) => {
    // Sem as variáveis de ambiente, o servidor não tem como conferir credencial. Responder
    // 503 é mais honesto do que liberar a escrita ou fingir que a senha está errada.
    if (!autenticacaoConfigurada()) {
        return res.status(503).json({
            mensagem:
                'A autenticação não está configurada neste servidor. Defina ADMIN_SENHA_HASH e SESSAO_SEGREDO.'
        });
    }

    if (!temSessao(req)) {
        return res.status(401).json({ mensagem: 'Faça login para alterar o estoque.' });
    }

    next();
};

module.exports = exigirAutenticacao;
