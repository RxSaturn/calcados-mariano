# Calçados Mariano

Sistema de gestão de estoque para a Calçados Mariano, loja de calçados de Bambuí, Minas Gerais.

O sistema tem duas partes que funcionam juntas. Uma API REST guarda o estoque em um banco SQLite. Um painel web em React lê e escreve por essa API.

O dono da loja usa o painel para ver o estoque, buscar um calçado por nome, categoria ou numeração, cadastrar produto novo e enxergar de imediato o que está acabando.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Execução](#execução)
- [API](#api)
- [Execução de Testes](#execução-de-testes)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Limitações Conhecidas](#limitações-conhecidas)
- [Licença](#licença)

---

## Visão Geral

A Calçados Mariano vende calçados em duas unidades em Bambuí, uma matriz e uma filial.

Este repositório dá à loja um controle de estoque por software. O sistema registra cada calçado com a sua numeração, guarda a quantidade em estoque e permite buscar um produto por nome, categoria ou numeração.

Este documento não descreve como a loja controla o estoque hoje. O time ainda não levantou essa informação.

O sistema tem **dois públicos**, e por isso duas telas.

**A vitrine (`/`), para quem vem da rua.** Mostra os calçados que a loja tem em
estoque, com numeração e cor, e leva a conversa para o WhatsApp com a mensagem
já preenchida. Ela **não vende, não cobra e não coleta dado nenhum** — a venda
continua no atendimento, presencial ou pelo WhatsApp. A tela não promete nada
diferente disso, e há teste garantindo que ela não volte a prometer.

**O painel (`/admin`), para quem cuida do estoque.** Lista o que tem, destaca o
que está acabando, e permite cadastrar, editar e remover. Pede senha, porque
quem entra ali muda o estoque da loja. A senha é definida na instalação e não
tem valor padrão.

**A API (`server.js` e `src/`).** Um servidor Express sobre a tabela `produtos`,
com listagem filtrada e paginada, busca, cadastro, edição e remoção. Leitura é
pública, porque a vitrine é pública; escrita exige sessão.

Em produção **um processo só entrega as duas telas e a API**, na mesma porta. É
o que faz a instalação na máquina da loja caber num comando.

---

## Tecnologias

### Backend

| Item           | Tecnologia             | Versão                    |
| -------------- | ---------------------- | ------------------------- |
| Runtime        | Node.js                | 22.x (testado em 22.22.2) |
| Framework web  | Express                | 5.2.1                     |
| Banco de dados | SQLite (via `sqlite3`) | 6.0.1                     |
| Middleware     | `cors`                 | 2.8.6                     |
| Módulos        | CommonJS (`require`)   | n/a                       |

### Frontend

| Item               | Tecnologia                     | Versão |
| ------------------ | ------------------------------ | ------ |
| Biblioteca de UI   | React                          | 19.2.8 |
| Build e dev server | Vite                           | 8.1.5  |
| Plugin de build    | `@vitejs/plugin-react`         | 6.0.4  |
| Linter             | ESLint (flat config)           | 10.8.0 |
| Estilo             | CSS puro com custom properties | n/a    |
| Módulos            | ESM (`import`)                 | n/a    |

O projeto usa JavaScript em toda a base de código. Não há TypeScript.

---

## Pré-requisitos

Instale estes programas antes de continuar.

1. **Node.js 20 ou maior.** O time testou o projeto no Node 22.22.2. O pacote `sqlite3` compila um módulo nativo, portanto prefira uma versão LTS.
2. **npm 10 ou maior.** O npm acompanha a instalação do Node.
3. **Git.**

Verifique as versões instaladas:

```bash
node -v
npm -v
```

O backend e as telas são dois projetos npm: a raiz e `web/`. Em produção, porém,
**um processo só entrega tudo**, e a instalação é um comando.

---

## Instalação

Na máquina onde o sistema vai rodar:

```bash
git clone https://github.com/RxSaturn/calcados-mariano.git
cd calcados-mariano
npm run instalar
```

O comando faz seis passos e para no primeiro que falhar: confere o Node, instala
as dependências dos dois lados, cria o `.env`, **pede a senha do painel sem
mostrá-la na tela**, prepara o banco e compila as telas.

A senha é obrigatória e não tem padrão. Sem ela o painel sobe e recusa todo
cadastro com `503` — e essa é uma falha que só aparece quando o dono da loja
tenta usar, dias depois.

Para instalar sem ninguém no terminal, as respostas podem vir do ambiente:

```bash
INSTALAR_SENHA='uma senha de verdade' INSTALAR_PORTA=3000 npm run instalar
```

### Sobre o banco de dados

O arquivo `calcados_mariano.db` **não** vem no repositório. O comando `npm run db:setup` o cria a partir de dois arquivos SQL versionados:

| Arquivo         | Conteúdo                                               |
| --------------- | ------------------------------------------------------ |
| `db/schema.sql` | A estrutura da tabela `produtos` e os índices.         |
| `db/seed.sql`   | Os calçados de exemplo, para o banco não nascer vazio. |

O comando não apaga dados. Quando a tabela já tem produtos, ele avisa e não altera nada. Para recarregar os dados de exemplo e descartar o que existe, use `npm run db:setup -- --reset`.

Um clone que não roda este comando fica com um banco vazio, e as rotas de produto respondem `500`. A rota `GET /health` avisa quando isso acontece.

---

## Execução

### Na máquina da loja

```bash
npm start
```

Um processo só, uma porta só:

| Endereço                      | O que é                             |
| :---------------------------- | :---------------------------------- |
| `http://localhost:3000`       | a vitrine, aberta a quem vem da rua |
| `http://localhost:3000/admin` | o painel de estoque, que pede senha |

Em Windows, `deploy/iniciar-sistema.bat` faz isso com dois cliques e abre o
navegador. Copiado para a pasta que aparece ao digitar `shell:startup`, ele liga
o sistema sozinho quando o computador liga.

### Cópia de segurança

```bash
npm run backup
```

Guarda o estoque em `backups/`, mantendo as 14 últimas. Pode rodar com o sistema
no ar: a cópia é feita pelo próprio SQLite e sai consistente.

A cópia é conferida por dentro antes de ser guardada — os produtos são contados
contra o banco de origem. Uma cópia que não bate é apagada, porque cópia ruim é
pior que nenhuma: quem a vê na pasta acredita estar protegido.

Para restaurar: feche o sistema, copie o arquivo escolhido de `backups/` para a
raiz com o nome `calcados_mariano.db`, e ligue de novo. Em Windows,
`deploy/copia-de-seguranca.bat` traz esse passo a passo no cabeçalho.

### Em desenvolvimento

Aqui sim são dois terminais, e é de propósito: o Vite recarrega a tela a cada
alteração.

### Backend

Na raiz do projeto, execute:

```bash
npm start
```

O servidor sobe na porta `3000`. Ele imprime duas linhas quando tudo funciona:

```
Servidor rodando na porta 3000
Conectado ao banco de dados SQLite da Calçados Mariano!
```

Confirme que o servidor e o banco respondem:

```bash
curl http://localhost:3000/health
# {"status":"ok","banco":"conectado","produtos":13}
```

Para parar o servidor, pressione `Ctrl+C`.

### Comandos do backend

| Comando                       | O que faz                                                 |
| ----------------------------- | --------------------------------------------------------- |
| `npm start`                   | Sobe o servidor na porta 3000.                            |
| `npm run dev`                 | Sobe o servidor e o reinicia quando um arquivo muda.      |
| `npm run db:setup`            | Cria o banco a partir de `db/schema.sql` e `db/seed.sql`. |
| `npm run db:setup -- --reset` | Recarrega os dados de exemplo e descarta os atuais.       |

As variáveis de ambiente ficam documentadas em `.env.example`. Copie o arquivo para `.env` e ajuste o que precisar. A variável `PORT` muda a porta, e `DB_PATH` muda o caminho do banco.

### Frontend

Em um segundo terminal, execute:

```bash
cd web
npm run dev
```

O Vite serve a interface em `http://localhost:5173`. O terminal mostra a URL exata.

### Outros comandos do frontend

| Comando           | O que faz                                                  |
| ----------------- | ---------------------------------------------------------- |
| `npm run dev`     | Sobe o servidor de desenvolvimento com recarga automática. |
| `npm run build`   | Gera a versão de produção na pasta `dist/`.                |
| `npm run preview` | Serve a pasta `dist/` para conferência local.              |
| `npm run lint`    | Roda o ESLint em todo o frontend.                          |

O painel depende da API. Suba o backend antes, porque a tela carrega o estoque da rota `GET /produtos`. Em desenvolvimento, o `vite.config.js` encaminha as chamadas para a porta 3000, portanto o navegador fala só com a origem do Vite e o CORS não entra no caminho.

---

## API

O servidor escuta em `http://localhost:3000`. Todas as respostas usam JSON, com uma exceção: a rota raiz devolve texto puro.

### `GET /`

Confirma que o servidor está no ar. Devolve texto puro, não JSON.

```bash
curl http://localhost:3000/
```

```
Servidor da Calçados Mariano rodando com sucesso!
```

Esta rota não verifica o banco de dados. Ela responde `200` mesmo quando o banco falha. Para monitoramento, use `GET /health`.

### `GET /health`

Diz se o servidor **e o banco** estão em condições de atender. Use esta rota em monitoramento e em smoke tests.

```bash
curl http://localhost:3000/health
```

```json
{ "status": "ok", "banco": "conectado", "produtos": 13 }
```

Quando o banco não responde:

```json
{
  "status": "indisponivel",
  "banco": "sem resposta",
  "mensagem": "SQLITE_ERROR: no such table: produtos"
}
```

| Resposta | Quando                                                           |
| -------- | ---------------------------------------------------------------- |
| `200`    | O banco respondeu. O campo `produtos` traz a contagem de linhas. |
| `503`    | O banco não respondeu, ou a tabela `produtos` não existe.        |

A verificação consulta a tabela `produtos` de propósito. Uma consulta como `SELECT 1` provaria só que a conexão abriu. O driver `sqlite3` cria um arquivo vazio quando o banco não existe, portanto `SELECT 1` passaria em um clone onde ninguém rodou `npm run db:setup`.

### `GET /produtos`

Lista todos os produtos da tabela.

```bash
curl http://localhost:3000/produtos
```

```json
[
  {
    "id": 2,
    "nome": "Sapato Social Preto",
    "numeracao": "40",
    "categoria": "Sapato",
    "subcategoria": null,
    "quantidade": 15,
    "status_estoque": "Em estoque",
    "marca": null,
    "cor": null,
    "descricao": null
  }
]
```

| Resposta | Quando                                                   |
| -------- | -------------------------------------------------------- |
| `200`    | A consulta funcionou. O corpo traz um array de produtos. |
| `500`    | O banco de dados falhou.                                 |

### `GET /produtos/buscar`

Busca produtos por um campo. A rota exige dois parâmetros de query.

| Parâmetro | Obrigatório | Valores aceitos                  | O que faz                                                                                 |
| --------- | ----------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `tipo`    | Sim         | `nome`, `categoria`, `numeracao` | Escolhe a coluna da busca.                                                                |
| `termo`   | Sim         | Texto livre                      | O valor procurado. Busca parcial para `nome` e `categoria`. Busca exata para `numeracao`. |

```bash
curl "http://localhost:3000/produtos/buscar?tipo=nome&termo=bota"
```

```json
[
  {
    "id": 3,
    "nome": "Bota Texana Bico Quadrado",
    "numeracao": "41",
    "categoria": "Bota (texana)",
    "quantidade": 8,
    "status_estoque": "Em estoque"
  }
]
```

A rota rejeita um pedido incompleto com `400` e uma mensagem que diz o que falta:

```bash
curl "http://localhost:3000/produtos/buscar?termo=41"
```

```json
{
  "mensagem": "O parâmetro \"tipo\" é obrigatório e precisa ser um destes: nome, categoria, numeracao."
}
```

| Resposta | Quando                                                                                |
| -------- | ------------------------------------------------------------------------------------- |
| `200`    | A busca funcionou. O corpo traz um array, que pode vir vazio.                         |
| `400`    | O pedido não trouxe `tipo`, ou trouxe um `tipo` fora da lista, ou não trouxe `termo`. |
| `500`    | O banco de dados falhou.                                                              |

> **Histórico.** Até a correção do item P0-1, um pedido sem `tipo` derrubava o processo do servidor com segmentation fault e código de saída 139. O modelo montava uma consulta SQL vazia e o driver `sqlite3` falhava em código nativo. A rota agora valida os dois parâmetros antes de chegar ao banco.

### `POST /produtos`

Cadastra um produto novo.

```bash
curl -X POST http://localhost:3000/produtos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Tênis Casual Azul",
    "categoria": "Tênis",
    "quantidade": 10,
    "status_estoque": "Em estoque",
    "numeracao": "42"
  }'
```

```json
{ "mensagem": "Produto adicionado com sucesso!" }
```

| Campo            | Tipo   | Coluna           |
| ---------------- | ------ | ---------------- |
| `nome`           | texto  | `nome`           |
| `categoria`      | texto  | `categoria`      |
| `quantidade`     | número | `quantidade`     |
| `status_estoque` | texto  | `status_estoque` |
| `numeracao`      | texto  | `numeracao`      |

| Resposta | Quando                       |
| -------- | ---------------------------- |
| `201`    | O servidor gravou o produto. |
| `500`    | A gravação falhou.           |

> **Atenção:** esta rota não valida a entrada e não pede autenticação. O CORS aceita qualquer origem. Qualquer pessoa com acesso à rede grava linhas na tabela. Não exponha este servidor na internet no estado atual.

### Esquema da tabela `produtos`

```sql
CREATE TABLE "produtos" (
  "id"             INTEGER,
  "nome"           TEXT,
  "numeracao"      TEXT,
  "categoria"      TEXT,
  "subcategoria"   TEXT,
  "quantidade"     INTEGER,
  "status_estoque" TEXT,
  "marca"          TEXT,
  "cor"            TEXT,
  "descricao"      TEXT,
  PRIMARY KEY("id")
);
```

A rota `POST /produtos` grava cinco das dez colunas. As colunas `subcategoria`, `marca`, `cor` e `descricao` ficam nulas em todas as 13 linhas atuais. A tabela não tem coluna de preço e não tem coluna de imagem.

---

## Execução de Testes

O projeto tem **46 testes automatizados**: 34 no backend e 12 no painel.

### Backend

```bash
npm test          # roda uma vez
npm run test:watch
```

| Arquivo                      | O que cobre                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| `tests/smoke.test.js`        | O app carrega, `/health` responde, `/produtos` devolve array. |
| `tests/produtos.test.js`     | As três rotas pela camada HTTP, com os casos de erro.         |
| `tests/produtoModel.test.js` | Os quatro caminhos de `buscar` e a validação de `adicionar`.  |

Cada arquivo de teste cria o seu próprio banco temporário, a partir dos mesmos `db/schema.sql` e `db/seed.sql` que o `npm run db:setup` usa. Nenhum teste toca o banco de desenvolvimento.

### Painel

```bash
cd web
npm test
```

Os testes do painel substituem o módulo da API por mocks. Eles conferem a tela: a tabela renderiza, o destaque de estoque baixo aparece na linha certa, a busca chama a API com o tipo e o termo escolhidos, e os erros de validação da API aparecem na tela.

### Verificações da integração contínua

O arquivo `.github/workflows/ci.yml` roda tudo no Node 20 e 22, a cada push na `main` e a cada pull request.

| Onde   | Comandos                                                               |
| ------ | ---------------------------------------------------------------------- |
| Raiz   | `npm run lint`, `npm run format:check`, `npm run db:setup`, `npm test` |
| Raiz   | Um smoke test contra o servidor de verdade, com `curl`                 |
| Painel | `npm run lint`, `npm test`, `npm run build`                            |

Rode os mesmos comandos antes de abrir um pull request. Veja o [CONTRIBUTING.md](CONTRIBUTING.md).

## Estrutura de Diretórios

```
calcados-mariano/
├── server.js                       # Entrada do backend. Só abre a porta.
├── package.json                    # Dependências, scripts e metadados do backend.
├── .env.example                    # Variáveis de ambiente, com o valor padrão de cada uma.
│                                   # (calcados_mariano.db não é versionado. Rode npm run db:setup.)
│
├── db/                             # Definição do banco de dados.
│   ├── schema.sql                  # Estrutura da tabela produtos e os índices.
│   ├── seed.sql                    # Treze calçados de exemplo.
│   └── setup.js                    # Cria o banco a partir dos dois arquivos acima.
│
├── src/                            # Código do backend, separado por camada.
│   ├── app.js                      # Monta o Express, os middlewares e as rotas. Não abre porta.
│   ├── config/
│   │   └── db.js                   # Abre a conexão SQLite. Lê DB_PATH.
│   ├── routes/
│   │   ├── healthRoutes.js         # Declara a rota GET /health.
│   │   └── produtoRoutes.js        # Declara as três rotas de produto.
│   ├── controllers/
│   │   ├── HealthController.js     # Responde 200 ou 503 conforme o banco.
│   │   └── ProdutoController.js    # Trata requisição e resposta HTTP. Define os status.
│   └── models/
│       ├── HealthModel.js          # Consulta a tabela para provar que o banco responde.
│       └── ProdutoModel.js         # Monta as consultas SQL e valida a entrada.
│
├── tests/                          # Testes do backend, com Vitest e Supertest.
│   ├── helpers/bancoDeTeste.js     # Cria um banco temporário por arquivo de teste.
│   ├── smoke.test.js               # O sistema sobe e atende.
│   ├── produtos.test.js            # As três rotas, pela camada HTTP.
│   └── produtoModel.test.js        # O model, sem HTTP.
│
├── web/                 # Projeto npm separado. O painel em React.
│   ├── index.html                  # Documento raiz que o Vite serve.
│   ├── vite.config.js              # Configuração do Vite, com o proxy para a API.
│   ├── vitest.config.js            # Configuração dos testes do painel.
│   ├── .env.example                # VITE_API_URL e VITE_ESTOQUE_BAIXO.
│   └── src/
│       ├── main.jsx                # Ponto de entrada do React.
│       ├── App.jsx                 # Compõe a tela e guarda o estado. Não desenha nada sozinho.
│       ├── config.js               # URL da API, limite de estoque baixo e dados da loja.
│       ├── api/produtos.js         # Cliente HTTP da API de estoque.
│       ├── components/             # Header, BuscaForm, EstoqueTable, EstoqueRow,
│       │                           # ProdutoForm e Footer.
│       ├── __tests__/              # Testes do painel, com Testing Library.
│       ├── App.css                 # Estilos do painel.
│       └── index.css               # Estilos globais e as variáveis de cor.
│
├── .github/
│   ├── workflows/ci.yml            # Integração contínua.
│   ├── dependabot.yml              # Atualização de dependências.
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/
│
└── docs/
    └── ROADMAP.md                  # Plano técnico priorizado.
```

O backend segue uma separação em camadas. A rota recebe a URL, o controller trata o HTTP e o model fala com o banco. Uma camada só chama a camada abaixo dela.

O `server.js` e o `src/app.js` têm papéis separados de propósito. O `app.js` monta o Express e exporta o app, sem abrir porta. O `server.js` importa esse app e chama `listen`. Essa divisão permite que um teste importe o app e chame as rotas sem ocupar a porta 3000.

No painel, o `App.jsx` só compõe a tela e guarda o estado. Cada parte da interface vive em `src/components`, e toda chamada de rede passa por `src/api/produtos.js`.

## Limitações Conhecidas

Esta lista descreve o estado real do código. O arquivo [`docs/ROADMAP.md`](docs/ROADMAP.md) traz o plano com prioridades.

| #   | Limitação                                                                                                             | Impacto                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `POST /produtos` valida a entrada, mas **não pede autenticação**. Qualquer pessoa com acesso à rede cadastra produto. | Alto. Não exponha este servidor na internet.                |
| 2   | Não existe rota para editar nem para remover produto. O painel só lista, busca e cadastra.                            | Médio. A correção de um erro de digitação exige SQL na mão. |
| 3   | O painel não tem paginação. Ele carrega o estoque inteiro em uma chamada.                                             | Baixo hoje, com 13 produtos. Cresce com o catálogo.         |
| 4   | A tabela `produtos` tem as colunas `subcategoria`, `marca`, `cor` e `descricao`, e nada as preenche.                  | Baixo. Colunas mortas no esquema.                           |
| 5   | Os dados da loja ficam em `web/src/config.js`, e não em variável de ambiente.                                         | Baixo. Precisa sair do código antes de qualquer publicação. |
| 6   | O `status_estoque` é texto livre no banco. O formulário oferece três opções, mas a API aceita qualquer texto.         | Baixo. Permite valor fora do padrão via API.                |

## Licença

**Este projeto não tem licença definida.** O repositório não traz um arquivo `LICENSE`. O `package.json` declara `"license": "UNLICENSED"` e `"private": true`, que é a forma de dizer que nenhuma licença foi concedida.

Sem uma licença explícita, ninguém tem permissão de uso, cópia ou distribuição deste código. Trate o repositório como privado.

O código traz dados reais da loja, entre eles os telefones das duas unidades. O time precisa decidir o licenciamento antes de qualquer publicação. O item está registrado como decisão pendente em [`docs/ROADMAP.md`](docs/ROADMAP.md).
