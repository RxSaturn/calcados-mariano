const express = require('express');

//Importa a biblioteca CORS
const cors = require('cors');

const app = express();

// O CORS libera a entrada do front-end para o back-end.
//
// A variável CORS_ORIGINS lista as origens aceitas, separadas por vírgula. Quando ela
// não existe, o servidor aceita qualquer origem, o que serve só para desenvolvimento.
// Antes desta mudança, o cors() sem opções aceitava qualquer origem sempre, e a rota de
// escrita não pedia autenticação.
const origensAceitas = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origem) => origem.trim())
    .filter((origem) => origem !== '');

// credentials: true é necessário porque a sessão do painel viaja em cookie. O padrão do
// CORS não envia cookie entre origens diferentes.
//
// Sem CORS_ORIGINS, o servidor aceita qualquer origem e NÃO libera credencial. Isso é
// proposital: o navegador proíbe origem coringa junto com credencial, e em
// desenvolvimento o proxy do Vite deixa tudo na mesma origem, portanto o cookie funciona
// sem CORS entrar no caminho.
app.use(
    cors(
        origensAceitas.length > 0 ? { origin: origensAceitas, credentials: true } : { origin: true }
    )
);

// Puxando a conexão com o banco de dados para ele ser inicializado
require('./config/db');

// Permite que o servidor entenda dados enviados no formato JSON
app.use(express.json());

// Rota raiz. Diz apenas que o processo está no ar, e não olha o banco.
// Ela vem antes das outras para deixar a ordem de registro explícita.
app.get('/', (req, res) => {
    res.send('Servidor da Calçados Mariano rodando com sucesso!');
});

// Importando os arquivos de rotas
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const produtoRoutes = require('./routes/produtoRoutes');

// Avisando ao servidor para usar essas rotas
app.use('/', healthRoutes);
app.use('/', authRoutes);
app.use('/', produtoRoutes);

// Este arquivo monta o app e para aí. Ele não chama app.listen de propósito.
// Quem abre a porta é o server.js. Assim um teste importa este arquivo, chama as
// rotas com supertest e não ocupa a porta 3000.
module.exports = app;
