const express = require('express');

//Importa a biblioteca CORS
const cors = require('cors');

const app = express();

// O 'app.use' aplica o CORS no seu servidor, ele libera a entrada do front-end para o back-end,
// permitindo que eles se comuniquem sem problemas de bloqueio de origem cruzada (CORS).
app.use(cors());

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
const produtoRoutes = require('./routes/produtoRoutes');

// Avisando ao servidor para usar essas rotas
app.use('/', healthRoutes);
app.use('/', produtoRoutes);

// Este arquivo monta o app e para aí. Ele não chama app.listen de propósito.
// Quem abre a porta é o server.js. Assim um teste importa este arquivo, chama as
// rotas com supertest e não ocupa a porta 3000.
module.exports = app;
