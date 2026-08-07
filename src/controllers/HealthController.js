const HealthModel = require('../models/HealthModel');

const HealthController = {
    // Responde se o servidor e o banco estão em condições de atender.
    // A rota raiz não serve para isso, porque ela responde 200 sem olhar o banco.
    verificarSaude: (req, res) => {
        HealthModel.verificarBanco((erro, linha) => {
            if (erro) {
                return res.status(503).json({
                    status: 'indisponivel',
                    banco: 'sem resposta',
                    mensagem: erro.message
                });
            }
            return res.status(200).json({
                status: 'ok',
                banco: 'conectado',
                produtos: linha.total
            });
        });
    }
};

module.exports = HealthController;
