# Changelog

Este arquivo registra as mudanças que importam para quem usa ou mantém o projeto.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não lançado]

### Adicionado

- Painel de estoque em React. A tela lê o estoque da API, filtra por nome, categoria ou numeração, cadastra produto e destaca as linhas com quantidade baixa.
- Rota `GET /health`, que consulta a tabela `produtos` e responde `200` ou `503`.
- Suíte de testes: 136 testes no backend com Vitest e Supertest, e 31 no painel com Testing Library.
- Integração contínua no GitHub Actions. Roda lint, formatação, testes com cobertura e build.
- `db/schema.sql`, `db/seed.sql` e o comando `npm run db:setup`, que criam o banco.
- Validação de entrada em `POST /produtos`, com a lista completa de erros na resposta.
- Configuração por ambiente: `PORT`, `DB_PATH` e `CORS_ORIGINS`, documentadas em `.env.example`.
- Documentação: `README.md`, `docs/ROADMAP.md`, `CONTRIBUTING.md` e este arquivo.
- ESLint e Prettier no backend, `.editorconfig` e `.nvmrc`.
- Coluna `publico` na tabela `produtos`, separada de `categoria`. A primeira diz para quem o calçado é, e a segunda diz qual é o tipo dele.
- Colunas `imagem_url` e `nome_ordenacao`. A segunda guarda o nome sem acento, porque o SQLite não tem colação por idioma e `Sapatênis` caía depois de `Sapato`.
- Migração de colunas em `db/setup.js`. Um banco criado por uma versão anterior recebe o que falta, sem ser recriado.
- Rotas `GET /produtos/:id`, `GET /produtos/categorias`, `PUT /produtos/:id` e `DELETE /produtos/:id`.
- Filtro por `publico` e `categoria`, ordenação e paginação em `GET /produtos`.
- Autenticação de sessão. `POST /auth/login`, `POST /auth/logout` e `GET /auth/sessao`, com cookie `httpOnly` e token assinado com HMAC-SHA256. A senha vira hash `scrypt`. **Não existe senha padrão.** Sem `ADMIN_SENHA_HASH` e `SESSAO_SEGREDO`, o login responde `503`.
- Script `npm run auth:hash`, que gera o hash da senha para o `.env`.
- Tabela `estoque`, com o saldo de cada unidade da loja e chave `(produto_id, unidade)`.
- Tabela `movimentacoes`, com o histórico de entrada e saída.
- Rotas `GET /produtos/:id/estoque`, `GET /produtos/:id/movimentacoes` e `POST /produtos/:id/movimentacoes`. As três exigem sessão, porque o saldo por loja e o histórico descrevem a operação.
- `PRAGMA foreign_keys = ON` na conexão e no `db/setup.js`. Sem ele, o `ON DELETE CASCADE` não roda e remover um produto deixaria saldo órfão.
- Cobertura de teste com `@vitest/coverage-v8`, script `npm run test:coverage` e um piso aplicado na CI nos dois pacotes.

### Modificado

- A pasta `vitrine-frontend/` passou a se chamar `painel-estoque/`. O nome antigo descrevia uma vitrine pública, e o objetivo do projeto é a gestão de estoque interna.
- `src/app.js` monta o Express e o `server.js` só abre a porta. Isso permite que os testes importem o app sem ocupar a porta 3000.
- O CORS aceita a lista de `CORS_ORIGINS`. Antes aceitava qualquer origem sempre.
- `package.json`: `main` aponta para `server.js`, e os scripts `start`, `dev`, `db:setup`, `test`, `lint` e `format` passaram a existir.
- A licença declarada mudou de `ISC` para `UNLICENSED`, com `private: true`. O projeto nunca teve arquivo `LICENSE`, e a declaração anterior concedia uma permissão que ninguém decidiu.
- **`GET /produtos` mudou de contrato.** A resposta deixou de ser um array cru e passou a ser o envelope `{ produtos, total, pagina, limite, paginas }`. A tela precisa do total para montar a paginação.
- **`PUT /produtos/:id` mudou de contrato.** Ele deixou de alterar a quantidade e o status. Um corpo que traga `quantidade` ou `status_estoque` recebe `400`, com a rota da movimentação na mensagem. O saldo passa por uma porta só, senão uma correção à mão mudaria o número sem deixar rastro no histórico.
- `POST /produtos` grava as colunas todas, e não cinco delas. Antes, um produto cadastrado pela API nascia com `publico` nulo e não aparecia em nenhum filtro de público.
- `POST /produtos` abre o saldo por unidade na mesma transação, e grava a entrada de abertura com o motivo `Cadastro inicial`.
- A matriz da CI passou de Node 20 e 22 para **Node 22 e 24**. As dependências de teste exigem Node 22 ou mais, e o job do Node 20 falhava.
- A carga inicial adotou os 16 produtos do banco do repositório original, com `marca`, `cor` e `descrição` preenchidas, e com a categoria corrigida.

### Corrigido

- `GET /produtos/buscar` sem o parâmetro `tipo` derrubava o processo do servidor com segmentation fault e código de saída 139. A rota agora responde `400`. Era negação de serviço sem autenticação.
- A busca rejeita nomes herdados de `Object`, como `constructor` e `__proto__`, usados no parâmetro `tipo`.
- A carga inicial não tem mais os espaços sobrando que havia no banco antigo, na categoria `'Tênis de Futsal\r\n'` e no status `'Em estoque '`.
- `index.html` declara `lang="pt-BR"`.
- Os índices saíram para `db/indexes.sql`. O índice de `publico` rodava antes do `ALTER TABLE` que cria a coluna, e a criação do banco falhava com `no such column`.
- `imagem_url` recusa um valor que não comece com `/`, `http://` ou `https://`. A vitrine põe esse valor no atributo `src`, portanto um `javascript:` viraria execução de script na página do cliente.
- Um valor fora da lista em `ordenar` responde `400`, em vez de cair no padrão em silêncio. Cair no padrão faria a tela mostrar outra ordem sem avisar ninguém.
- Uma saída maior que o saldo da unidade responde `400`. O saldo nunca fica negativo, e o saldo de uma loja não paga a saída de outra.

### Removido

- O arquivo `calcados_mariano.db` saiu do controle de versão. Rode `npm run db:setup` depois de clonar.
- A dependência `mysql2`, que nenhum arquivo importava.
- Os pacotes `@types/react` e `@types/react-dom`. O projeto não usa TypeScript.
- Os arquivos `hero.png`, `react.svg` e `vite.svg`, que ninguém usava.
- A lista fixa `produtosMock`, com oito produtos inventados e fotos de banco de imagens.
- A variável CSS `--vermelho-netshoes`, que levava o nome de um concorrente. O nome novo é `--vermelho-marca`.
