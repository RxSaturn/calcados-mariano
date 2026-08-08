const path = require('path');
const fs = require('fs');
const express = require('express');

//Importa a biblioteca CORS
const cors = require('cors');

const app = express();

/*
 * Pasta do front-end compilado.
 *
 * Na máquina da loja, o mesmo processo entrega as duas telas e a API. Isso não é
 * economia de servidor: é o que faz a instalação caber num passo. Com uma origem
 * só, não há CORS para configurar, não há segunda porta e não há endereço de API
 * para digitar em lugar nenhum — o dono da loja abre localhost:3000 e acabou.
 *
 * Em desenvolvimento a pasta não existe, o Vite continua servindo na 5173 com
 * proxy, e nada aqui muda.
 */
const PASTA_WEB = path.resolve(__dirname, '../web/dist');
const temFrontCompilado = fs.existsSync(path.join(PASTA_WEB, 'index.html'));

/** Prefixos que pertencem à API. O front nunca responde por eles. */
const CAMINHOS_DA_API = ['/produtos', '/health', '/auth'];

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

// Rota raiz, só para quem roda o servidor sem ter compilado o front. Com o
// front compilado, quem responde em `/` é a vitrine, e não este texto.
if (!temFrontCompilado) {
    app.get('/', (req, res) => {
        res.send('Servidor da Calçados Mariano rodando com sucesso!');
    });
}

// Importando os arquivos de rotas
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const produtoRoutes = require('./routes/produtoRoutes');

// Avisando ao servidor para usar essas rotas
app.use('/', healthRoutes);
app.use('/', authRoutes);
app.use('/', produtoRoutes);

/*
 * As duas telas, entregues pelo próprio servidor.
 *
 * Vem depois das rotas de propósito: assim a API responde primeiro, e o front
 * só recebe o que sobrou. Um caminho de API que não existe devolve JSON de
 * erro, e não a página HTML — quem chama a API espera JSON, e receber HTML no
 * lugar dá um erro de leitura que não diz nada sobre a causa.
 *
 * O `index.html` responde por qualquer outro endereço porque as rotas do React
 * vivem no navegador. Sem isso, recarregar a página em `/admin` daria 404: o
 * servidor procuraria um arquivo com esse nome, que nunca existiu.
 */
if (temFrontCompilado) {
    app.use(
        express.static(PASTA_WEB, {
            index: false,
            setHeaders: (res, caminho) => {
                // Os arquivos de `assets` têm o conteúdo no próprio nome, então
                // trocam de nome a cada build e podem ser guardados para sempre.
                if (caminho.includes(`${path.sep}assets${path.sep}`)) {
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                }
            }
        })
    );

    app.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        if (CAMINHOS_DA_API.some((prefixo) => req.path.startsWith(prefixo))) {
            return res.status(404).json({ mensagem: 'Rota não encontrada.' });
        }
        // Sem cache: é este arquivo que aponta para a versão nova do resto.
        res.setHeader('Cache-Control', 'no-cache');
        return res.sendFile(path.join(PASTA_WEB, 'index.html'));
    });
}

// Este arquivo monta o app e para aí. Ele não chama app.listen de propósito.
// Quem abre a porta é o server.js. Assim um teste importa este arquivo, chama as
// rotas com supertest e não ocupa a porta 3000.
module.exports = app;
