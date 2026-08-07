// Ponto de entrada do backend. Este arquivo só abre a porta.
// A montagem do Express, os middlewares e as rotas ficam em src/app.js, para que
// um teste possa importar o app sem subir um servidor.

const app = require('./src/app');

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
