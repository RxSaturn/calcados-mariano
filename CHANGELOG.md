# Changelog

Este arquivo registra as mudanças que importam para quem usa ou mantém o projeto.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não lançado]

### Entrega na máquina da loja

- `npm run instalar`: um comando do zero até o sistema no ar. Ele pede a senha do
  painel sem mostrá-la na tela, e sem essa senha o sistema não fica utilizável.
- O servidor passou a entregar as duas telas e a API na mesma porta. Antes eram
  dois terminais, com o front no servidor de desenvolvimento do Vite.
- `npm run backup`: cópia do banco, conferida por dentro antes de ser guardada.
  Restaurar é trocar o arquivo.
- Atalhos de dois cliques para Windows, em `deploy/`.

### Vitrine

- Trazida do repositório original, com o trabalho de GabsSR preservado no
  histórico, e ligada à API de verdade.
- Filtro por público feito pelo servidor, com igualdade, no lugar da adivinhação
  sobre o texto da categoria.
- Saíram as afirmações de "Compra 100% Segura", "SSL" e "dados protegidos". A
  vitrine não vende, não cobra e não coleta dado nenhum.

### Painel

- Tela de login. A API já exigia sessão para escrever, e a tela nunca pedia
  senha: na prática o painel não cadastrava nada.
- Editar e remover produto, com confirmação na própria linha.
- 401 e 503 passaram a dizer coisas diferentes: senha errada e sistema sem senha
  configurada não são o mesmo problema.

### Corrigido

- **Ninguém carregava o arquivo `.env`.** O código lia as variáveis, o
  `.env.example` mandava criar o arquivo, e faltava a peça do meio. Quem seguisse
  o roteiro terminava com o login respondendo 503.

### Testes

- 100 no servidor e 42 nas telas.

### Adicionado

- Painel de estoque em React. A tela lê o estoque da API, filtra por nome, categoria ou numeração, cadastra produto e destaca as linhas com quantidade baixa.
- Rota `GET /health`, que consulta a tabela `produtos` e responde `200` ou `503`.
- Suíte de testes: 34 testes no backend com Vitest e Supertest, e 12 no frontend com Testing Library.
- Integração contínua no GitHub Actions. Roda lint, formatação, testes e build no Node 20 e 22.
- `db/schema.sql`, `db/seed.sql` e o comando `npm run db:setup`, que criam o banco.
- Validação de entrada em `POST /produtos`, com a lista completa de erros na resposta.
- Configuração por ambiente: `PORT`, `DB_PATH` e `CORS_ORIGINS`, documentadas em `.env.example`.
- ESLint e Prettier no backend, `.editorconfig` e `.nvmrc`.

### Modificado

- A pasta `vitrine-frontend/` passou a se chamar `painel-estoque/`. O nome antigo descrevia uma vitrine pública, e o objetivo do projeto é a gestão de estoque interna.
- `src/app.js` monta o Express e o `server.js` só abre a porta. Isso permite que os testes importem o app sem ocupar a porta 3000.
- O CORS aceita a lista de `CORS_ORIGINS`. Antes aceitava qualquer origem sempre.
- `package.json`: `main` aponta para `server.js`, e os scripts `start`, `dev`, `db:setup`, `test`, `lint` e `format` passaram a existir.
- A licença declarada mudou de `ISC` para `UNLICENSED`, com `private: true`. O projeto nunca teve arquivo `LICENSE`, e a declaração anterior concedia uma permissão que ninguém decidiu.

### Corrigido

- `GET /produtos/buscar` sem o parâmetro `tipo` derrubava o processo do servidor com segmentation fault e código de saída 139. A rota agora responde `400`. Era negação de serviço sem autenticação.
- A busca rejeita nomes herdados de `Object`, como `constructor` e `__proto__`, usados no parâmetro `tipo`.
- A carga inicial não tem mais os espaços sobrando que havia no banco antigo, na categoria `'Tênis de Futsal\r\n'` e no status `'Em estoque '`.
- `index.html` declara `lang="pt-BR"`.

### Removido

- O arquivo `calcados_mariano.db` saiu do controle de versão. Rode `npm run db:setup` depois de clonar.
- A dependência `mysql2`, que nenhum arquivo importava.
- Os pacotes `@types/react` e `@types/react-dom`. O projeto não usa TypeScript.
- Os arquivos `hero.png`, `react.svg` e `vite.svg`, que ninguém usava.
- A lista fixa `produtosMock`, com oito produtos inventados e fotos de banco de imagens.
- A variável CSS `--vermelho-netshoes`, que levava o nome de um concorrente. O nome novo é `--vermelho-marca`.
