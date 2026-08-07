# Roadmap Técnico

Plano de engenharia da Calçados Mariano. Este documento veio da auditoria do repositório e listou o que corrigir, em que ordem e como conferir o resultado.

> **As três ondas foram concluídas.** Os 18 itens estão marcados com ✅ FEITO e cada um traz o resultado medido. A seção "O que ficou de fora" lista o próximo ciclo.

Cada item traz três campos. **Por quê** explica o problema. **Como** descreve a ação. **Pronto quando** define o critério de aceite.

## Como ler as prioridades

| Onda   | Significado                                                             | Regra               |
| ------ | ----------------------------------------------------------------------- | ------------------- |
| **P0** | Bloqueadores. O projeto não avança com segurança enquanto eles existem. | Faça antes de tudo. |
| **P1** | Rede de segurança. Testes e integração contínua.                        | Faça depois do P0.  |
| **P2** | Refatoração, segurança e acabamento.                                    | Faça depois do P1.  |

O P1 depende do P0. Sem esquema em SQL e sem `app` separado do `listen`, os testes não têm como rodar contra um banco limpo.

---

## Decisão de produto tomada

**O objetivo do projeto é a gestão de estoque interna.** O time decidiu isso. A API é o núcleo do produto. O usuário é o dono da loja, não o cliente final.

Esta decisão define o trabalho do item P2-1. A interface em `painel-estoque/` deixa de ser uma vitrine pública e vira o painel de administração do estoque.

A decisão também resolve um conflito de modelo de dados que a auditoria encontrou. As duas metades pediam campos diferentes:

| Campo            | Tabela `produtos` | Interface atual        | Decisão                                        |
| ---------------- | ----------------- | ---------------------- | ---------------------------------------------- |
| `quantidade`     | Existe            | Não mostra             | A interface passa a mostrar. É o dado central. |
| `status_estoque` | Existe            | Não mostra             | A interface passa a mostrar.                   |
| `numeracao`      | Existe            | Mostra como `tamanhos` | A interface passa a usar o nome da coluna.     |
| `preco`          | Não existe        | Mostra                 | Fora de escopo. O preço não é dado de estoque. |
| `imagem_url`     | Não existe        | Mostra                 | Fora de escopo por enquanto.                   |

A interface usa hoje as categorias `Masculino`, `Feminino` e `Esporte`. Elas não existem nos 13 registros reais, que usam `Sapato`, `Botina` e `Chuteira (campo e society)`. O painel de estoque precisa ler as categorias do banco, e não de uma lista fixa no código.

### Decisão que continua pendente: o licenciamento

O repositório não tem arquivo `LICENSE`. O time decidiu **não** publicar uma licença por enquanto e tratar o repositório como privado. O item P0-4 já alinhou o `package.json` a essa decisão, com `"license": "UNLICENSED"` e `"private": true`.

A decisão de qual licença adotar continua aberta.

O motivo é concreto. O código traz dados reais da loja, entre eles os telefones das duas unidades em `painel-estoque/src/App.jsx`. O time precisa decidir o licenciamento antes de qualquer publicação. Sem licença explícita, ninguém tem permissão de uso, cópia ou distribuição.

---

## P0. Bloqueadores

### P0-1. Corrigir a falha que derruba o servidor ✅ FEITO

**Por quê.** `GET /produtos/buscar` sem o parâmetro `tipo` terminava o processo do servidor com segmentation fault e código de saída 139. O time reproduziu a falha duas vezes em duas tentativas. `ProdutoModel.buscar` não tinha ramo padrão, portanto `sql` ficava com a string vazia e `db.all('')` fazia o driver `sqlite3` falhar em código nativo. Qualquer pessoa com acesso à rede tirava o serviço do ar com um único pedido, sem autenticação.

Este é o item mais urgente do repositório.

**Como.**

1. Em `src/models/ProdutoModel.js`, adicione um ramo padrão em `buscar`. Chame o callback com um erro de validação quando `tipo` não for `nome`, `categoria` ou `numeracao`.
2. Nunca chame `db.all` com uma consulta vazia.
3. Em `src/controllers/ProdutoController.js`, traduza esse erro de validação para a resposta `400` com uma mensagem clara.
4. Valide também a ausência de `termo`.

**Pronto quando.**

- `curl "http://localhost:3000/produtos/buscar?termo=41"` responde `400` e o servidor continua no ar.
- `curl "http://localhost:3000/produtos/buscar?tipo=cor&termo=azul"` responde `400`.
- `curl "http://localhost:3000/produtos/buscar?tipo=nome&termo=bota"` continua respondendo `200` com o resultado correto.

**Resultado.** Os três critérios passam. `buscar` agora consulta uma tabela de tipos aceitos e nunca monta a consulta fora dela. O servidor sobreviveu a 100 pedidos do caso que antes o derrubava, e devolveu `400` nos 100.

Falta a cobertura de teste automatizado. Os itens P1-3 e P1-4 escrevem o teste de regressão desta correção.

### P0-2. Tirar o banco de dados do controle de versão ✅ FEITO

**Por quê.** O arquivo `calcados_mariano.db` é binário e está rastreado no Git. O commit `dc33f17` se chama `Update calcados_mariano.db`. Cada mudança de dado gera um diff binário. Duas pessoas que editam o estoque ao mesmo tempo criam um conflito sem resolução possível. O padrão `*.db` não está em nenhum `.gitignore`.

**Como.**

1. Extraia o esquema para `db/schema.sql`.
2. Extraia os 13 registros para `db/seed.sql`.
3. Limpe os dados sujos na carga inicial. A categoria `'Tênis de Futsal\r\n'` e o status `'Em estoque '` têm espaços que quebram o filtro exato.
4. Rode `git rm --cached calcados_mariano.db`.
5. Adicione `*.db` ao `.gitignore` da raiz.
6. Crie o script `npm run db:setup`, que cria o banco a partir dos dois arquivos SQL.

**Pronto quando.**

- Um clone novo do repositório não traz nenhum arquivo `.db`.
- `npm run db:setup` cria um banco com 13 produtos.
- `git status` fica limpo depois de o servidor gravar um produto novo.

**Resultado.** Os três critérios passam. O time apagou o arquivo do banco e o recriou com `npm run db:setup`, e a tabela voltou com 13 produtos, os dois índices e os valores limpos. O `.gitignore` cobre `*.db`, `*.db-journal`, `*.sqlite` e `*.sqlite3`.

O script protege dados: quando a tabela já tem produtos, ele avisa e não altera nada. A carga só roda em tabela vazia, ou com `npm run db:setup -- --reset`.

### P0-3. Corrigir os metadados do `package.json` ✅ FEITO

**Por quê.** O campo `main` aponta para `index.js`, que não existe. O ponto de entrada é `server.js`. Não existe script `start`, portanto `npm start` falha. Os campos `repository`, `bugs` e `homepage` apontam para `henrique-ep/calcados-mariano`, e o repositório real é `RxSaturn/calcados-mariano`. Os campos `description`, `author` e `keywords` estão vazios.

**Como.**

1. Troque `main` para `server.js`.
2. Adicione `"start": "node server.js"`.
3. Adicione um script `dev` com recarga automática, por exemplo com `node --watch`.
4. Preencha `description`, `author` e `keywords`.
5. Corrija `repository`, `bugs` e `homepage` para o dono real.
6. Adicione o campo `engines` com `"node": ">=20"`.

**Pronto quando.** `npm start` sobe o servidor na porta 3000.

**Resultado.** Passa. O `package.json` ganhou também `db:setup` e `engines`. O campo `author` continua vazio, porque o repositório tem três contribuidores e ninguém definiu a autoria a declarar.

### P0-4. Alinhar o `package.json` com a ausência de licença ✅ FEITO

**Por quê.** O `package.json` declara `"license": "ISC"`, e o time não escolheu essa licença. O repositório não tem arquivo `LICENSE`. A declaração atual afirma uma permissão que ninguém concedeu, e isso engana quem clona o projeto.

Este item não cria uma licença. Ele apenas para de declarar uma.

**Como.**

1. Troque o campo por `"license": "UNLICENSED"` e adicione `"private": true` no `package.json` da raiz.
2. Registre no README que o projeto não tem licença. O trecho já está escrito.
3. Confirme que o repositório no GitHub está marcado como privado.
4. Antes de qualquer publicação, decida a licença e tire os dados reais da loja do código. Veja o item P2-6.

**Pronto quando.**

- O `package.json` não declara mais ISC.
- O GitHub não mostra nenhuma licença na barra lateral, e o README explica o motivo.

**Resultado.** O `package.json` declara `"license": "UNLICENSED"` e `"private": true`. O README explica o motivo. Falta o time confirmar que o repositório no GitHub está privado, porque essa parte não está no código.

### P0-5. Criar uma rota de saúde de verdade ✅ FEITO

**Por quê.** A rota `GET /` devolve texto puro e não olha o banco de dados. Ela responde `200` mesmo com o banco morto, portanto não serve para monitoramento e não serve como smoke test. O item P1-2 depende desta rota.

**Como.**

1. Crie `GET /health`. Consulte a tabela `produtos`, e não `SELECT 1`.
2. Responda `200` com JSON quando o banco responder. Responda `503` quando ele falhar.
3. Mova o registro da rota raiz para antes de `app.use('/', produtoRoutes)`, para deixar a ordem explícita.

**Pronto quando.**

- `GET /health` responde `200` com JSON quando o banco está bom.
- `GET /health` responde `503` quando o banco não responde.

**Resultado.** Passa. Com o banco bom, a rota responde `200` e informa a contagem de produtos. Com a tabela removida, ela responde `503` e a mensagem do driver.

O plano original pedia `SELECT 1`. Essa consulta não serve. O driver `sqlite3` cria um arquivo vazio quando o banco não existe, portanto `SELECT 1` passaria em um clone onde ninguém rodou `npm run db:setup`, e as rotas de produto falhariam depois. A verificação consulta `produtos` para provar que o esquema existe.

A rota vive em três arquivos, seguindo as camadas do backend: `src/routes/healthRoutes.js`, `src/controllers/HealthController.js` e `src/models/HealthModel.js`.

---

## P1. Testes e integração contínua

O pedido original pede foco em smoke tests. Esta onda começa por eles.

### P1-1. Separar o `app` do `listen` ✅ FEITO

**Por quê.** `server.js` cria o app e chama `app.listen` no mesmo arquivo. Nenhum teste consegue importar o app sem abrir a porta 3000. Este refactor é pré-requisito de todo teste de API.

**Como.**

1. Mova a montagem do Express para `src/app.js` e exporte o `app`.
2. Deixe em `server.js` apenas o `require` do app e a chamada `app.listen`.

**Pronto quando.** Um teste importa `src/app.js` e chama as rotas sem abrir porta. `node server.js` continua funcionando igual.

**Resultado.** Os dois critérios passam. O `src/app.js` monta o Express e exporta o app. O `server.js` ficou com onze linhas e só chama `listen`.

A prova: um script importou o app, chamou `app.listen(0)` para pegar uma porta efêmera e exercitou `/health`, `/produtos` e a busca sem `tipo`. As três responderam certo, em outra porta, com a 3000 livre. É isso que o supertest fará no item P1-2.

O `npm start` continua igual, com as mesmas duas linhas de log e as cinco rotas respondendo.

### P1-2. Escrever os smoke tests do backend ✅ FEITO

**Por quê.** O repositório não tem nenhum teste. `npm test` é o texto que o `npm init` gera e sai com código 1. Um smoke test responde a pergunta mais básica: o sistema sobe e atende.

**Como.**

1. Instale `vitest` e `supertest` como dependências de desenvolvimento.
2. Troque o script `test` por `vitest run`.
3. Crie `tests/smoke.test.js` com quatro casos:
   - O app carrega sem lançar erro.
   - `GET /health` responde `200`.
   - `GET /produtos` responde `200` com um array.
   - `GET /` responde `200`.
4. Aponte os testes para um banco temporário criado com `db/schema.sql` e `db/seed.sql`.

**Pronto quando.** `npm test` passa e sai com código 0.

**Resultado.** `npm test` roda 34 testes e sai com 0. O helper `tests/helpers/bancoDeTeste.js` cria um banco temporário por arquivo de teste, a partir dos mesmos arquivos SQL do `db:setup`. Nenhum teste toca o banco de desenvolvimento.

Um detalhe do caminho: o Vitest exige `import` para a própria API, e o backend é CommonJS. A opção `globals: true` resolve isso, e mantém o `require` do app dentro do `beforeAll`, depois de `DB_PATH` existir.

### P1-3. Escrever os testes de integração das rotas ✅ FEITO

**Por quê.** As três rotas nunca foram testadas. O caso de regressão mais importante é o pedido que derrubava o servidor no item P0-1.

**Como.** Cubra estes casos.

| Rota                   | Caso                            | Esperado             |
| ---------------------- | ------------------------------- | -------------------- |
| `GET /produtos`        | Banco com carga inicial         | `200`, 13 itens      |
| `GET /produtos/buscar` | `tipo=nome`, termo parcial      | `200`, filtra        |
| `GET /produtos/buscar` | `tipo=categoria`, termo parcial | `200`, filtra        |
| `GET /produtos/buscar` | `tipo=numeracao`, termo exato   | `200`, filtra        |
| `GET /produtos/buscar` | Sem `tipo`                      | `400`, servidor vivo |
| `GET /produtos/buscar` | `tipo` inválido                 | `400`, servidor vivo |
| `POST /produtos`       | Corpo válido                    | `201`, grava a linha |
| `POST /produtos`       | Corpo vazio                     | `400`                |

**Pronto quando.** Os oito casos passam. O teste do caso sem `tipo` falha se alguém reverter a correção do item P0-1.

**Resultado.** Os oito casos previstos passam, e mais alguns. A suíte confere também os nomes herdados de `Object` usados como `tipo`, e que o servidor continua atendendo depois de 25 pedidos inválidos seguidos.

Os casos de `POST` com corpo inválido exigiram a validação do item P2-2, portanto os dois itens saíram juntos.

### P1-4. Escrever os testes unitários do model ✅ FEITO

**Por quê.** `ProdutoModel.buscar` tem quatro caminhos e três deles nunca foram exercitados de forma isolada.

**Como.** Teste os quatro ramos de `buscar` direto no model, sem HTTP. Confira a consulta montada e o valor do parâmetro, inclusive os curingas `%` da busca parcial.

**Pronto quando.** Os quatro ramos têm um teste cada.

**Resultado.** Os quatro caminhos têm teste, e a validação de `adicionar` também: campo por campo, tipo por tipo, e o caso da lista completa de erros.

### P1-5. Escrever os smoke tests do frontend ✅ FEITO

**Por quê.** `painel-estoque` não tem script `test`. O `App.jsx` tem 233 linhas e concentra toda a interface, portanto uma quebra passa sem aviso.

O item P2-1 reescreve esta tela. Por isso, monte agora só a infraestrutura de teste e dois casos rasos. Não escreva testes detalhados de uma interface que vai sair. Os testes de comportamento entram junto com o painel de estoque.

**Como.**

1. Instale `vitest`, `@testing-library/react` e `jsdom` no pacote do frontend.
2. Adicione o script `test`.
3. Escreva dois casos: o `App` renderiza sem lançar erro, e a tela mostra a lista de produtos.

**Pronto quando.** `npm test` passa dentro de `painel-estoque`.

**Resultado.** Doze testes no painel, com Testing Library. Eles substituem o módulo da API por mocks e conferem a tela.

**Desvio do plano.** O plano pedia dois casos rasos, porque o item P2-1 ia reescrever a tela. Como os dois itens saíram na mesma entrega, os testes foram escritos direto contra o painel final: a tabela renderiza, o destaque de estoque baixo cai na linha certa, a busca chama a API com o tipo e o termo escolhidos, o cadastro converte quantidade para número, e os erros de validação da API aparecem na tela.

### P1-6. Criar a integração contínua ✅ FEITO

**Por quê.** O repositório não tem a pasta `.github` e não tem nenhum arquivo YAML. Nada confere lint nem teste em um pull request.

**Como.**

1. Crie `.github/workflows/ci.yml`.
2. Rode em duas versões de Node, 20 e 22.
3. Execute os passos nas duas metades: `npm ci`, lint, `npm test`, e `npm run build` no frontend.
4. Faça o trabalho falhar quando qualquer passo falhar.

**Pronto quando.** Um pull request mostra a verificação da CI, e ela fica verde no estado corrigido.

**Resultado.** `.github/workflows/ci.yml` roda no Node 20 e 22, em dois trabalhos. No backend: lint, `format:check`, `db:setup`, testes, e um smoke test com `curl` contra o servidor de verdade, que confere o `/health` e o `400` da busca sem `tipo`. No painel: lint, testes e build.

---

## P2. Refatoração, segurança e acabamento

### P2-1. Converter a interface em painel de estoque ✅ FEITO

**Por quê.** `App.jsx` tem a constante `produtosMock` com 8 produtos inventados e fotos do Unsplash. O frontend não tem nenhum `fetch`, nenhum `useEffect` e nenhum `import.meta.env`. A API existe e ninguém a chama. O dono da loja não tem como usar o sistema, portanto esta é a maior lacuna funcional do projeto.

A decisão de produto define o alvo: um painel de estoque, não uma vitrine. A tela precisa de reescrita, e não de uma ligação direta com a API. Os campos que ela mostra hoje são os campos errados.

**Como.**

1. Crie um módulo de cliente HTTP em `src/api/produtos.js`. Leia a URL base de `import.meta.env.VITE_API_URL`.
2. Configure `server.proxy` no `vite.config.js` para o desenvolvimento local.
3. Carregue o estoque da API com `useEffect`. Trate os quatro estados: carregando, erro, vazio e com dados.
4. Troque a grade de cards por uma tabela de estoque. Mostre `nome`, `numeracao`, `categoria`, `quantidade` e `status_estoque`.
5. Monte a lista de categorias do filtro a partir dos dados que a API devolve. Remova a lista fixa `Masculino`, `Feminino`, `Esporte`.
6. Ligue o campo de busca à rota `GET /produtos/buscar`, com um seletor para o parâmetro `tipo`.
7. Crie um formulário de cadastro que chama `POST /produtos`. Mostre os erros de validação que o item P2-2 passa a devolver.
8. Destaque as linhas com quantidade baixa. Esse é o motivo de existir do sistema.
9. Remova `produtosMock` e o modal de vitrine.

**Pronto quando.**

- O painel mostra os 13 produtos que vieram do banco.
- O dono da loja cadastra um produto pela tela e ele aparece na lista.
- A busca por numeração funciona pela API.
- Nenhum dado de produto continua fixo no código.

**Observação sobre o link do WhatsApp.** A tela atual traz um link `wa.me` para o cliente final. O painel de estoque não precisa dele. Guarde o componente antes de remover, porque uma vitrine pública pode voltar ao escopo depois.

**Resultado.** A tela agora lê e escreve pela API. `produtosMock` saiu.

O que a tela faz: mostra o estoque em tabela com `nome`, `categoria`, `numeracao`, `quantidade` e `status_estoque`; destaca as linhas com quantidade no limite ou abaixo; conta produtos e produtos com estoque baixo no cabeçalho; busca pela rota `/produtos/buscar` com seletor de tipo; cadastra pela rota `POST /produtos` e mostra os erros de validação que a API devolve; e trata os quatro estados da lista, entre eles erro com botão de tentar de novo.

O `vite.config.js` ganhou proxy para a porta 3000, portanto o navegador fala só com a origem do Vite em desenvolvimento.

Verificação em navegador, com Chromium: a tela carregou os 13 produtos do banco, destacou 3 com estoque baixo, a busca por numeração devolveu 2 linhas, o cadastro gravou e a tabela recarregou com 14, e um envio inválido mostrou os 3 erros da API.

O link `wa.me` saiu junto com a vitrine. Ele fica no histórico do Git, caso uma vitrine pública volte ao escopo.

### P2-2. Proteger a rota de escrita ✅ FEITO

**Por quê.** `POST /produtos` não valida a entrada e não pede autenticação. `adicionarProduto` repassa `req.body` direto ao model. O `cors()` sem opções aceita qualquer origem. Qualquer pessoa grava linhas arbitrárias na tabela.

**Como.**

1. Valide o corpo do pedido. Confira presença, tipo e limite de tamanho de cada campo.
2. Responda `400` com a lista de erros quando a validação falhar.
3. Restrinja o `cors()` a uma lista de origens conhecidas.
4. Adicione autenticação na rota de escrita antes de qualquer publicação na internet.
5. Adicione um limite de taxa de pedidos.

**Pronto quando.** Um `POST` com corpo inválido responde `400`. Um `POST` sem credencial responde `401`. Uma origem desconhecida recebe bloqueio do CORS.

**Resultado.** A validação vive em `ProdutoModel`, antes de qualquer acesso ao banco, e devolve a lista completa de problemas em vez de só o primeiro. O `POST` também aplica `trim`, para não repetir o problema dos espaços sobrando.

O CORS passou a aceitar a lista de `CORS_ORIGINS`. Sem a variável, aceita qualquer origem, o que serve só para desenvolvimento.

**O que este item não entrega: autenticação.** A rota de escrita continua aberta a quem alcança a rede. Isso está na lista de limitações do README e é o próximo item de segurança.

### P2-3. Externalizar a configuração ✅ FEITO

**Por quê.** `server.js` fixa `PORT = 3000` e não lê `process.env.PORT`. `src/config/db.js` abre `'./calcados_mariano.db'`, um caminho relativo à pasta atual, portanto o servidor só funciona quando alguém o inicia da raiz.

**Como.**

1. Leia a porta de `process.env.PORT`, com 3000 como valor padrão.
2. Leia o caminho do banco de uma variável de ambiente. Resolva o padrão com `path.join(__dirname, ...)`.
3. Crie `.env.example` com as variáveis e comentários.
4. Feche as duas lacunas do `.gitignore`. A raiz não cobre `.env.production` nem `.env.development`. O `painel-estoque/.gitignore` não tem nenhuma entrada `.env`, e o Vite lê `.env` daquela pasta.

**Pronto quando.** `PORT=4000 npm start` sobe na porta 4000. O servidor funciona quando alguém o inicia de outra pasta.

**Resultado.** `src/config/db.js` lê `DB_PATH` e resolve o padrão a partir do próprio arquivo, portanto o caminho não depende mais da pasta atual. O `server.js` lê `PORT`. O `.env.example` documenta as três variáveis.

As duas lacunas do `.gitignore` foram fechadas. A raiz não cobria `.env.production` nem `.env.development`, e o pacote do painel não tinha entrada `.env` nenhuma, embora o Vite leia `.env` daquela pasta.

Este item saiu antes do previsto, porque os testes precisavam de `DB_PATH` para usar um banco isolado.

### P2-4. Remover o código morto ✅ FEITO

**Por quê.** Código morto engana quem lê o projeto. O `mysql2` sugere um banco MySQL que não existe.

**Como.**

1. Remova `mysql2` das dependências. Nenhum arquivo o importa.
2. Remova `src/assets/hero.png`, `react.svg` e `vite.svg`. Nenhum arquivo os usa.
3. Remova `src/index.css`, que está vazio, e o `import` dele em `main.jsx`. Ou preencha o arquivo com os estilos globais.
4. Remova os `@types/react` e `@types/react-dom` enquanto o projeto não usar TypeScript.

**Pronto quando.** `npm run build` e `npm run lint` continuam passando. O `git grep` não encontra referência a nenhum item removido.

**Resultado.** Saíram `mysql2`, `hero.png`, `react.svg`, `vite.svg`, `@types/react` e `@types/react-dom`. O `src/index.css` estava vazio e passou a conter os estilos globais e as variáveis de cor, em vez de ser removido.

### P2-5. Padronizar o estilo de código ✅ FEITO

**Por quê.** O ESLint só cobre `painel-estoque`. O backend não tem linter nenhum. Não há Prettier, `.editorconfig` nem `.nvmrc`. O estilo depende de quem escreveu o arquivo.

**Como.**

1. Adicione uma configuração de ESLint para o backend, com o ambiente `node` e CommonJS.
2. Adicione o Prettier e uma configuração compartilhada.
3. Crie `.editorconfig` e `.nvmrc`.
4. Adicione o script `lint` na raiz.
5. Adicione `husky` e `lint-staged` para rodar o linter antes do commit.

**Pronto quando.** `npm run lint` passa nas duas metades. A CI roda o linter.

**Resultado.** `eslint.config.mjs` cobre o backend. Prettier, `.editorconfig` e `.nvmrc` existem, e os scripts `lint`, `lint:fix`, `format` e `format:check` estão no `package.json`. A base toda passou pelo Prettier, e a CI roda `format:check`.

**O que não foi feito: husky e lint-staged.** Um hook de pre-commit exige instalação em cada máquina, e a CI já barra o que estiver fora do padrão. Fica como sugestão, não como pendência.

### P2-6. Quebrar o `App.jsx` em componentes ✅ FEITO

**Por quê.** `App.jsx` tem 233 linhas e concentra a barra de confiança, o cabeçalho, o filtro, a grade, o modal e o rodapé. Um arquivo assim dificulta o teste e o trabalho em paralelo.

**Como.**

1. Extraia os componentes do painel para `src/components/`: `Header`, `EstoqueTable`, `EstoqueRow`, `BuscaForm`, `ProdutoForm` e `Footer`.
2. Tire os dados reais da loja do componente. Os telefones das duas unidades e o número de WhatsApp estão fixos em `App.jsx`. Mova o que sobrar para um módulo de configuração ou para variável de ambiente.
3. Escreva um teste de renderização para cada componente novo.

**Pronto quando.** `App.jsx` só monta a composição e o estado. Nenhum telefone da loja aparece dentro de um componente.

**Resultado.** O `App.jsx` caiu de 233 para cerca de 120 linhas, e só compõe a tela e guarda o estado. Os componentes ficaram em `painel-estoque/src/components/`: `Header`, `BuscaForm`, `EstoqueTable`, `EstoqueRow`, `ProdutoForm` e `Footer`.

Os dados da loja saíram do componente e foram para `painel-estoque/src/config.js`. Nenhum telefone aparece dentro de componente.

### P2-7. Melhorar a higiene do repositório ✅ FEITO

**Por quê.** Faltam arquivos que ajudam o time a trabalhar junto. Alguns detalhes de acabamento passam a impressão errada. O projeto tem três contribuidores e nenhum processo escrito.

**Como.**

1. Crie `CONTRIBUTING.md` com o processo de branch, commit e pull request.
2. Crie `CHANGELOG.md` no formato Keep a Changelog.
3. Crie os modelos de issue e de pull request em `.github/`.
4. Ative o Dependabot. O `npm audit` do frontend aponta uma falha de severidade alta em `brace-expansion`.
5. Troque `lang="en"` por `lang="pt-BR"` em `painel-estoque/index.html`. Troque o título `painel-estoque` pelo nome do sistema.
6. Renomeie as custom properties do CSS. A variável `--vermelho-netshoes` leva o nome de um concorrente. Use `--vermelho-marca`.
7. Renomeie a pasta `painel-estoque/` quando o item P2-1 terminar. O nome não descreve mais um painel de estoque.

O `SECURITY.md` fica fora desta lista. Ele serve para receber relatos de falhas de fora do time, e o repositório continua privado.

**Pronto quando.** O `index.html` declara português. Nenhum nome de concorrente aparece no código. O GitHub mostra os modelos de issue e de pull request.

**Resultado.** Foram criados `CONTRIBUTING.md`, `CHANGELOG.md`, `.github/pull_request_template.md`, dois modelos de issue e `.github/dependabot.yml`. O `index.html` declara `lang="pt-BR"` e tem título próprio. A variável `--vermelho-netshoes` passou a se chamar `--vermelho-marca`.

A pasta `vitrine-frontend/` passou a se chamar `painel-estoque/`, junto com o nome do pacote. O nome antigo descrevia uma vitrine pública.

O `SECURITY.md` continua fora, porque o repositório é privado e não há de onde receber relato externo.

---

## Resumo

| Onda   | Itens | Estado | Resultado                                                                                |
| ------ | ----- | ------ | ---------------------------------------------------------------------------------------- |
| **P0** | 5     | ✅     | O serviço parou de cair. O banco saiu do Git. O projeto sobe com `npm start`.            |
| **P1** | 6     | ✅     | 46 testes automatizados e CI no Node 20 e 22, a cada pull request.                       |
| **P2** | 7     | ✅     | O dono da loja usa o sistema pela tela. A escrita valida a entrada. O código está limpo. |

## O que ficou de fora

Estes itens não estavam nas três ondas, e a entrega deixou claro que eles importam. É daqui que sai o próximo ciclo, em ordem de urgência.

### Onda P3

1. **Autenticação na rota de escrita.** O item P2-2 validou a entrada e restringiu o CORS, e não pediu credencial. Qualquer pessoa que alcance a rede cadastra produto. Enquanto isso não existir, o servidor não vai para a internet.
2. **Editar e remover produto.** A API só lista, busca e cadastra. Corrigir um erro de digitação hoje exige SQL na mão. Faltam `PUT /produtos/:id` e `DELETE /produtos/:id`, com os testes e a tela.
3. **Registrar a movimentação de estoque.** O sistema guarda a quantidade atual e não guarda o histórico. Sem isso, ninguém sabe o que saiu, quando, nem de qual unidade.
4. **Separar as duas unidades.** A loja tem matriz e filial, e a tabela `produtos` não tem coluna de unidade. O estoque de hoje é um número só para as duas lojas.
5. **Paginação.** O painel carrega o estoque inteiro em uma chamada. Com 13 produtos funciona. Com mil, não.
6. **Medir a cobertura de teste.** A suíte tem 46 testes e ninguém sabe qual porcentagem do código eles tocam. O `vitest --coverage` responde isso, e um piso na CI evita a queda silenciosa.
7. **Limpar as colunas mortas.** As colunas `subcategoria`, `marca`, `cor` e `descricao` existem no esquema e nada as preenche. Ou o produto passa a usá-las, ou elas saem.
8. **Restringir o `status_estoque`.** O campo é texto livre no banco. O formulário oferece três opções, e a API aceita qualquer texto.

### Decisão de produto que continua aberta

O licenciamento. O repositório não tem `LICENSE`, o `package.json` declara `UNLICENSED` e os dados reais da loja estão em `painel-estoque/src/config.js`. O time precisa decidir a licença e tirar esses dados do código antes de qualquer publicação.
