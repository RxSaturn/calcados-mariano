# Calçados Mariano

Sistema de gestão de estoque para a Calçados Mariano, loja de calçados de Bambuí, Minas Gerais.

O núcleo do projeto é uma API REST que controla o estoque de calçados da loja em um banco SQLite. O repositório traz também uma interface web em React, que hoje mostra uma vitrine e no futuro vira a tela de administração desse estoque.

> **Estado atual do projeto**
>
> A API funciona e responde. A interface web ainda não a consome. Ela mostra uma lista de produtos fixa no código, herdada de uma primeira versão em formato de vitrine. A conversão da interface em painel de estoque é o próximo passo do projeto. Veja [`docs/ROADMAP.md`](docs/ROADMAP.md).

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

**API de estoque (`server.js` e `src/`). Este é o núcleo do produto.** Um servidor Express que expõe três rotas HTTP sobre a tabela `produtos`. A API lista o estoque, busca produtos por nome, categoria ou numeração, e cadastra um produto novo. Cada produto guarda numeração, quantidade e situação de estoque.

**Interface web (`vitrine-frontend/`).** Uma página única em React. Hoje ela mostra uma vitrine de calçados em cards, com um filtro por categoria e um link para o WhatsApp da loja. Esse formato veio da primeira versão do projeto. O roadmap converte essa página no painel de administração do estoque, que lê e escreve pela API.

O usuário do sistema é o dono da loja, não o cliente final. O projeto não tem carrinho e não tem pagamento online. A venda continua no atendimento presencial.

---

## Tecnologias

### Backend

| Item | Tecnologia | Versão |
| --- | --- | --- |
| Runtime | Node.js | 22.x (testado em 22.22.2) |
| Framework web | Express | 5.2.1 |
| Banco de dados | SQLite (via `sqlite3`) | 6.0.1 |
| Middleware | `cors` | 2.8.6 |
| Módulos | CommonJS (`require`) | n/a |

### Frontend

| Item | Tecnologia | Versão |
| --- | --- | --- |
| Biblioteca de UI | React | 19.2.8 |
| Build e dev server | Vite | 8.1.5 |
| Plugin de build | `@vitejs/plugin-react` | 6.0.4 |
| Linter | ESLint (flat config) | 10.8.0 |
| Estilo | CSS puro com custom properties | n/a |
| Módulos | ESM (`import`) | n/a |

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

O backend e o frontend são dois projetos npm separados. Cada um tem o seu próprio `package.json` e o seu próprio `package-lock.json`. Você instala as dependências duas vezes.

---

## Instalação

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/RxSaturn/calcados-mariano.git
   cd calcados-mariano
   ```

2. Instale as dependências do backend:

   ```bash
   npm install
   ```

3. Crie o banco de dados:

   ```bash
   npm run db:setup
   ```

4. Instale as dependências do frontend:

   ```bash
   cd vitrine-frontend
   npm install
   cd ..
   ```

### Sobre o banco de dados

O arquivo `calcados_mariano.db` **não** vem no repositório. O comando `npm run db:setup` o cria a partir de dois arquivos SQL versionados:

| Arquivo | Conteúdo |
| --- | --- |
| `db/schema.sql` | A estrutura da tabela `produtos` e os índices. |
| `db/seed.sql` | Treze calçados de exemplo, para o banco não nascer vazio. |

O comando não apaga dados. Quando a tabela já tem produtos, ele avisa e não altera nada. Para recarregar os dados de exemplo e descartar o que existe, use `npm run db:setup -- --reset`.

Um clone que não roda este comando fica com um banco vazio, e as rotas de produto respondem `500`. A rota `GET /health` avisa quando isso acontece.

---

## Execução

O backend e o frontend rodam em terminais separados.

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

| Comando | O que faz |
| --- | --- |
| `npm start` | Sobe o servidor na porta 3000. |
| `npm run dev` | Sobe o servidor e o reinicia quando um arquivo muda. |
| `npm run db:setup` | Cria o banco a partir de `db/schema.sql` e `db/seed.sql`. |
| `npm run db:setup -- --reset` | Recarrega os dados de exemplo e descarta os atuais. |

> **Atenção:** execute os comandos sempre a partir da raiz do projeto. O caminho do banco é relativo à pasta atual, portanto o servidor não encontra o banco se você o iniciar de outro lugar. O item P2-3 do roadmap corrige isso.

### Frontend

Em um segundo terminal, execute:

```bash
cd vitrine-frontend
npm run dev
```

O Vite serve a interface em `http://localhost:5173`. O terminal mostra a URL exata.

### Outros comandos do frontend

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento com recarga automática. |
| `npm run build` | Gera a versão de produção na pasta `dist/`. |
| `npm run preview` | Serve a pasta `dist/` para conferência local. |
| `npm run lint` | Roda o ESLint em todo o frontend. |

O frontend não depende do backend hoje. Você pode abrir a interface sem iniciar o servidor.

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
{ "status": "indisponivel", "banco": "sem resposta", "mensagem": "SQLITE_ERROR: no such table: produtos" }
```

| Resposta | Quando |
| --- | --- |
| `200` | O banco respondeu. O campo `produtos` traz a contagem de linhas. |
| `503` | O banco não respondeu, ou a tabela `produtos` não existe. |

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

| Resposta | Quando |
| --- | --- |
| `200` | A consulta funcionou. O corpo traz um array de produtos. |
| `500` | O banco de dados falhou. |

### `GET /produtos/buscar`

Busca produtos por um campo. A rota exige dois parâmetros de query.

| Parâmetro | Obrigatório | Valores aceitos | O que faz |
| --- | --- | --- | --- |
| `tipo` | Sim | `nome`, `categoria`, `numeracao` | Escolhe a coluna da busca. |
| `termo` | Sim | Texto livre | O valor procurado. Busca parcial para `nome` e `categoria`. Busca exata para `numeracao`. |

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
{ "mensagem": "O parâmetro \"tipo\" é obrigatório e precisa ser um destes: nome, categoria, numeracao." }
```

| Resposta | Quando |
| --- | --- |
| `200` | A busca funcionou. O corpo traz um array, que pode vir vazio. |
| `400` | O pedido não trouxe `tipo`, ou trouxe um `tipo` fora da lista, ou não trouxe `termo`. |
| `500` | O banco de dados falhou. |

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

| Campo | Tipo | Coluna |
| --- | --- | --- |
| `nome` | texto | `nome` |
| `categoria` | texto | `categoria` |
| `quantidade` | número | `quantidade` |
| `status_estoque` | texto | `status_estoque` |
| `numeracao` | texto | `numeracao` |

| Resposta | Quando |
| --- | --- |
| `201` | O servidor gravou o produto. |
| `500` | A gravação falhou. |

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

**O projeto não tem testes automatizados.** Não existe nenhum arquivo de teste no repositório e nenhum framework de teste nas dependências.

O comando de teste do backend ainda é o texto que o `npm init` gera. Ele falha de propósito:

```bash
npm test
# Error: no test specified
# exit code 1
```

O frontend não define um script `test`.

Enquanto os testes não existem, use estas verificações manuais.

1. Crie o banco e inicie o backend:

   ```bash
   npm run db:setup
   npm start
   ```

2. Confirme que o servidor e o banco respondem:

   ```bash
   curl -s http://localhost:3000/health
   # {"status":"ok","banco":"conectado","produtos":13}
   ```

3. Confirme que a listagem devolve um array com 13 produtos:

   ```bash
   curl -s http://localhost:3000/produtos | head -c 200
   ```

4. Confirme que a busca filtra:

   ```bash
   curl -s "http://localhost:3000/produtos/buscar?tipo=nome&termo=bota"
   ```

5. Confirme que a busca incompleta responde `400` e o servidor continua no ar:

   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/produtos/buscar?termo=41"
   # 400
   curl -s http://localhost:3000/health
   # o servidor precisa continuar respondendo
   ```

6. Confirme que o frontend passa no linter e compila:

   ```bash
   cd vitrine-frontend
   npm run lint
   npm run build
   ```

O plano de testes automatizados está em [`docs/ROADMAP.md`](docs/ROADMAP.md), na onda P1. Ele começa por smoke tests com Vitest e Supertest.

---

## Estrutura de Diretórios

```
calcados-mariano/
├── server.js                       # Entrada do backend. Só abre a porta 3000.
├── package.json                    # Dependências, scripts e metadados do backend.
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
│   │   └── db.js                   # Abre a conexão SQLite e a exporta.
│   ├── routes/
│   │   ├── healthRoutes.js         # Declara a rota GET /health.
│   │   └── produtoRoutes.js        # Declara as três rotas de produto.
│   ├── controllers/
│   │   ├── HealthController.js     # Responde 200 ou 503 conforme o banco.
│   │   └── ProdutoController.js    # Trata requisição e resposta HTTP. Define os status.
│   └── models/
│       ├── HealthModel.js          # Consulta a tabela para provar que o banco responde.
│       └── ProdutoModel.js         # Monta e executa as consultas SQL.
│
├── vitrine-frontend/               # Projeto npm separado. A interface web em React.
│   ├── index.html                  # Documento raiz que o Vite serve.
│   ├── package.json                # Dependências e scripts do frontend.
│   ├── vite.config.js              # Configuração do Vite.
│   ├── eslint.config.js            # Regras do ESLint para o frontend.
│   ├── public/                     # Arquivos servidos sem processamento.
│   └── src/
│       ├── main.jsx                # Ponto de entrada do React. Monta o componente App.
│       ├── App.jsx                 # Toda a interface, em um componente. Usa dados fixos.
│       ├── App.css                 # Estilos da interface.
│       ├── index.css               # Arquivo vazio. O main.jsx ainda o importa.
│       └── assets/                 # Imagens do frontend.
│
└── docs/
    └── ROADMAP.md                  # Plano técnico priorizado.
```

O backend segue uma separação em camadas. A rota recebe a URL, o controller trata o HTTP e o model fala com o banco. Uma camada só chama a camada abaixo dela.

O `server.js` e o `src/app.js` têm papéis separados de propósito. O `app.js` monta o Express e exporta o app, sem abrir porta. O `server.js` importa esse app e chama `listen`. Essa divisão permite que um teste importe o app e chame as rotas sem ocupar a porta 3000.

---

## Limitações Conhecidas

Esta lista descreve o estado real do código. O arquivo [`docs/ROADMAP.md`](docs/ROADMAP.md) traz o plano de correção com prioridades.

| # | Limitação | Impacto |
| --- | --- | --- |
| 1 | `POST /produtos` não valida a entrada e não pede autenticação. O CORS aceita qualquer origem. | Alto. Escrita livre na base. |
| 2 | A interface web não chama a API. Ela usa a lista fixa `produtosMock` em `App.jsx`. | Alto. O dono da loja não tem como usar o sistema. |
| 3 | A interface mostra os campos errados para o objetivo. Ela exibe `preco` e `imagem_url`, que a tabela não tem. Ela não exibe `quantidade` nem `status_estoque`, que são o dado central do estoque. As categorias da interface não existem nos dados reais. | Alto. A tela precisa de reescrita, não de ligação direta. |
| 4 | A porta `3000` e o caminho do banco estão fixos no código. | Médio. Não há como configurar por ambiente. |
| 5 | Não há testes, não há CI e o backend não tem linter. | Médio. Nenhuma rede de segurança. |
| 6 | O `mysql2` está nas dependências mas o código nunca o importa. | Baixo. Dependência morta. |

---

## Licença

**Este projeto não tem licença definida.** O repositório não traz um arquivo `LICENSE`. O `package.json` declara `"license": "UNLICENSED"` e `"private": true`, que é a forma de dizer que nenhuma licença foi concedida.

Sem uma licença explícita, ninguém tem permissão de uso, cópia ou distribuição deste código. Trate o repositório como privado.

O código traz dados reais da loja, entre eles os telefones das duas unidades. O time precisa decidir o licenciamento antes de qualquer publicação. O item está registrado como decisão pendente em [`docs/ROADMAP.md`](docs/ROADMAP.md).
