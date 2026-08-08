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
- [Autenticação](#autenticação)
- [API](#api)
- [Esquema do banco](#esquema-do-banco)
- [Execução de Testes](#execução-de-testes)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Limitações Conhecidas](#limitações-conhecidas)
- [Licença](#licença)

---

## Visão Geral

A Calçados Mariano vende calçados em duas unidades em Bambuí, uma matriz e uma filial.

Este repositório dá à loja um controle de estoque por software. O sistema registra cada calçado com a sua numeração, guarda a quantidade em estoque e permite buscar um produto por nome, categoria ou numeração.

Este documento não descreve como a loja controla o estoque hoje. O time ainda não levantou essa informação.

**API de estoque (`server.js` e `src/`). Este é o núcleo do produto.** Um servidor Express sobre um banco SQLite. A API lista o estoque com filtro, ordenação e paginação, busca por nome, categoria ou numeração, cadastra, edita e remove produto, e guarda o saldo de cada unidade da loja com o histórico de entrada e saída. A leitura é pública. A escrita e o estoque por unidade exigem sessão.

**Painel web (`painel-estoque/`).** Uma página única em React que consome a API. Ela mostra o estoque em tabela, com nome, categoria, numeração, quantidade e situação. As linhas com quantidade no limite ou abaixo recebem destaque, porque avisar sobre falta é o motivo de existir do sistema. A página traz também a busca e o formulário de cadastro.

O usuário do sistema é o dono da loja, não o cliente final. O projeto não tem carrinho e não tem pagamento online. A venda continua no atendimento presencial.

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
   cd painel-estoque
   npm install
   cd ..
   ```

### Sobre o banco de dados

O arquivo `calcados_mariano.db` **não** vem no repositório. O comando `npm run db:setup` o cria a partir de dois arquivos SQL versionados:

| Arquivo                 | Conteúdo                                                      |
| ----------------------- | ------------------------------------------------------------- |
| `db/schema.sql`         | As tabelas `produtos`, `estoque` e `movimentacoes`.           |
| `db/indexes.sql`        | Os índices. Ficam à parte porque rodam depois da migração.    |
| `db/seed.sql`           | Dezesseis calçados de exemplo, para o banco não nascer vazio. |
| `db/estoque-inicial.js` | Abre o saldo por unidade dos produtos que ainda não têm.      |

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
# {"status":"ok","banco":"conectado","produtos":16}
```

Para parar o servidor, pressione `Ctrl+C`.

### Comandos do backend

| Comando                       | O que faz                                            |
| ----------------------------- | ---------------------------------------------------- |
| `npm start`                   | Sobe o servidor na porta 3000.                       |
| `npm run dev`                 | Sobe o servidor e o reinicia quando um arquivo muda. |
| `npm run db:setup`            | Cria e migra o banco a partir dos arquivos de `db/`. |
| `npm run db:setup -- --reset` | Recarrega os dados de exemplo e descarta os atuais.  |
| `npm run auth:hash`           | Gera o hash da senha do painel, para pôr no `.env`.  |
| `npm test`                    | Roda os testes do backend.                           |
| `npm run test:coverage`       | Roda os testes e aplica o piso de cobertura.         |

As variáveis de ambiente ficam documentadas em `.env.example`. Copie o arquivo para `.env` e ajuste o que precisar. A variável `PORT` muda a porta, e `DB_PATH` muda o caminho do banco.

### Frontend

Em um segundo terminal, execute:

```bash
cd painel-estoque
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

## Autenticação

O painel usa uma sessão com um credencial só, o do dono da loja. A leitura fica pública, porque a vitrine é pública. A escrita e o estoque por unidade exigem sessão.

**Não existe senha padrão.** O servidor lê duas variáveis de ambiente:

| Variável           | O que guarda                                                     |
| ------------------ | ---------------------------------------------------------------- |
| `ADMIN_SENHA_HASH` | O hash `scrypt` da senha, no formato `scrypt$<sal>$<hash>`.      |
| `SESSAO_SEGREDO`   | O segredo que assina o token da sessão. Use 32 bytes aleatórios. |

Gere o hash com o script do projeto e ponha o resultado no `.env`:

```bash
npm run auth:hash
```

Quando uma das duas variáveis falta, o login responde `503` com uma mensagem clara. O servidor nunca aceita uma senha qualquer.

O token viaja em um cookie `httpOnly` chamado `sessao_mariano`, com `SameSite=Lax` e validade de 12 horas. O cookie é assinado com HMAC-SHA256. Um cookie adulterado não vale.

---

## API

O servidor escuta em `http://localhost:3000`. Todas as respostas usam JSON, com uma exceção: a rota raiz devolve texto puro.

### Resumo das rotas

| Método   | Rota                          | Sessão | O que faz                                   |
| -------- | ----------------------------- | ------ | ------------------------------------------- |
| `GET`    | `/`                           | Não    | Diz que o processo está no ar.              |
| `GET`    | `/health`                     | Não    | Diz se o servidor e o banco atendem.        |
| `GET`    | `/produtos`                   | Não    | Lista com filtro, ordenação e paginação.    |
| `GET`    | `/produtos/buscar`            | Não    | Pesquisa por nome, categoria ou numeração.  |
| `GET`    | `/produtos/categorias`        | Não    | Categorias e públicos que existem no banco. |
| `GET`    | `/produtos/:id`               | Não    | Um produto.                                 |
| `POST`   | `/produtos`                   | Sim    | Cadastra, e abre o saldo inicial.           |
| `PUT`    | `/produtos/:id`               | Sim    | Edita os atributos. **Não muda o saldo.**   |
| `DELETE` | `/produtos/:id`               | Sim    | Remove o produto, o saldo e o histórico.    |
| `GET`    | `/produtos/:id/estoque`       | Sim    | Saldo de cada unidade, e o total.           |
| `GET`    | `/produtos/:id/movimentacoes` | Sim    | Histórico de entrada e saída, paginado.     |
| `POST`   | `/produtos/:id/movimentacoes` | Sim    | Registra entrada ou saída.                  |
| `POST`   | `/auth/login`                 | Não    | Abre a sessão.                              |
| `POST`   | `/auth/logout`                | Não    | Fecha a sessão.                             |
| `GET`    | `/auth/sessao`                | Não    | Diz se há sessão aberta.                    |

Uma rota que exige sessão responde `401` sem cookie válido, e `503` quando a autenticação não está configurada no servidor.

### `GET /health`

Diz se o servidor **e o banco** estão em condições de atender. Use esta rota em monitoramento e em smoke tests.

```json
{ "status": "ok", "banco": "conectado", "produtos": 16 }
```

| Resposta | Quando                                                    |
| -------- | --------------------------------------------------------- |
| `200`    | O banco respondeu. O campo `produtos` traz a contagem.    |
| `503`    | O banco não respondeu, ou a tabela `produtos` não existe. |

A verificação consulta a tabela `produtos` de propósito. Uma consulta como `SELECT 1` provaria só que a conexão abriu. O driver `sqlite3` cria um arquivo vazio quando o banco não existe, portanto `SELECT 1` passaria em um clone onde ninguém rodou `npm run db:setup`.

### `GET /produtos`

```bash
curl "http://localhost:3000/produtos?publico=Feminino&ordenar=nome&pagina=1&limite=20"
```

| Parâmetro   | Valores aceitos                                                  | Padrão     |
| ----------- | ---------------------------------------------------------------- | ---------- |
| `publico`   | `Masculino`, `Feminino`, `Infantil`, `Unissex`                   | sem filtro |
| `categoria` | Igualdade exata contra a coluna `categoria`                      | sem filtro |
| `ordenar`   | `nome`, `nome_desc`, `quantidade`, `quantidade_desc`, `recentes` | `nome`     |
| `pagina`    | Inteiro a partir de 1                                            | `1`        |
| `limite`    | Inteiro de 1 a 100                                               | `50`       |

A resposta é um envelope, e não um array cru, porque a tela precisa do total para montar a paginação:

```json
{ "produtos": [], "total": 16, "pagina": 1, "limite": 50, "paginas": 1 }
```

Um valor fora da lista em `ordenar` ou em `publico` responde `400`. A rota **não** cai no padrão em silêncio. Cair no padrão faria a tela mostrar outra ordem sem avisar ninguém.

A ordenação por nome usa a coluna `nome_ordenacao`, que guarda o nome sem acento e em minúscula. O SQLite não tem colação por idioma, portanto `Sapatênis` cairia depois de `Sapato` sem essa coluna.

### `GET /produtos/buscar`

| Parâmetro | Obrigatório | Valores aceitos                  | O que faz                                                          |
| --------- | ----------- | -------------------------------- | ------------------------------------------------------------------ |
| `tipo`    | Sim         | `nome`, `categoria`, `numeracao` | Escolhe a coluna da busca.                                         |
| `termo`   | Sim         | Texto livre                      | Busca parcial em `nome` e `categoria`. Busca exata em `numeracao`. |

> **Histórico.** Até a correção do item P0-1, um pedido sem `tipo` derrubava o processo com segmentation fault e código de saída 139. O model montava uma consulta vazia e o driver `sqlite3` falhava em código nativo. A consulta agora sai de uma tabela de valores aceitos, e nunca do texto do pedido.

### `POST /produtos`

Cadastra um produto e **abre o saldo inicial** na mesma transação.

```bash
curl -X POST http://localhost:3000/produtos -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"nome":"Tênis Casual Azul","categoria":"Tênis casual","publico":"Unissex",
       "numeracao":"42","quantidade":10,"unidade":"Matriz","marca":"Mariano"}'
```

| Campo            | Obrigatório | Regra                                             |
| ---------------- | ----------- | ------------------------------------------------- |
| `nome`           | Sim         | Texto, até 200 caracteres.                        |
| `categoria`      | Sim         | Texto. Guarda o **tipo** do calçado.              |
| `numeracao`      | Sim         | Texto, porque há faixas como `35/36`.             |
| `publico`        | Sim         | `Masculino`, `Feminino`, `Infantil` ou `Unissex`. |
| `quantidade`     | Sim         | Inteiro, zero ou mais. Vira o saldo de abertura.  |
| `unidade`        | Não         | `Matriz` ou `Filial`. O padrão é `Matriz`.        |
| `status_estoque` | Não         | Texto. Sem ele, o valor sai da quantidade.        |
| `marca`, `cor`   | Não         | Texto, até 200 caracteres.                        |
| `descricao`      | Não         | Texto, até 1000 caracteres.                       |
| `imagem_url`     | Não         | Precisa começar com `/`, `http://` ou `https://`. |

A regra do `imagem_url` existe porque a vitrine põe esse valor no atributo `src` de uma imagem. Um `javascript:` gravado no campo viraria execução de script na página do cliente.

Uma quantidade maior que zero gera uma movimentação de entrada com o motivo `Cadastro inicial`.

| Resposta | Quando                                                         |
| -------- | -------------------------------------------------------------- |
| `201`    | O servidor gravou o produto. O corpo traz o `id`.              |
| `400`    | A validação falhou. O corpo traz `erros` com a lista completa. |
| `401`    | Não veio sessão.                                               |
| `503`    | A autenticação não está configurada no servidor.               |

### `PUT /produtos/:id`

Substitui os atributos do produto: `nome`, `numeracao`, `categoria`, `publico`, `marca`, `cor`, `descricao` e `imagem_url`.

**Esta rota não muda a quantidade.** Um corpo que traga `quantidade` ou `status_estoque` recebe `400`, com a rota certa na mensagem.

O motivo é o histórico. Se a edição mudasse o saldo, o número mudaria sem deixar rastro, e o histórico teria furo exatamente onde ele mais importa: em uma correção feita à mão. O saldo muda por uma porta só, que é `POST /produtos/:id/movimentacoes`.

Um campo opcional que não vem no corpo fica nulo, porque `PUT` substitui o objeto.

### `POST /produtos/:id/movimentacoes`

Registra uma entrada ou uma saída em uma unidade.

```bash
curl -X POST http://localhost:3000/produtos/3/movimentacoes -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"unidade":"Filial","tipo":"saida","quantidade":2,"motivo":"Venda no balcão"}'
```

| Campo        | Obrigatório | Regra                                           |
| ------------ | ----------- | ----------------------------------------------- |
| `unidade`    | Sim         | `Matriz` ou `Filial`.                           |
| `tipo`       | Sim         | `entrada` ou `saida`.                           |
| `quantidade` | Sim         | Inteiro a partir de 1. O tipo é que dá o sinal. |
| `motivo`     | Não         | Texto, até 200 caracteres.                      |

Regras que a rota aplica:

- Uma saída maior que o saldo **daquela unidade** responde `400`. O saldo nunca fica negativo.
- O saldo de uma unidade não paga a saída de outra, mesmo quando o total do produto é suficiente.
- A movimentação e o recálculo do total acontecem na mesma transação. Ou as duas coisas valem, ou nenhuma vale.

```json
{
  "mensagem": "Movimentação registrada.",
  "id": 42,
  "produto_id": 3,
  "unidade": "Filial",
  "tipo": "saida",
  "quantidade": 2,
  "saldo": 1
}
```

### `GET /produtos/:id/estoque`

```json
{
  "produto_id": 3,
  "nome": "Bota Texana Bico Quadrado",
  "unidades": [
    { "unidade": "Matriz", "quantidade": 8 },
    { "unidade": "Filial", "quantidade": 0 }
  ],
  "total": 8
}
```

A leitura exige sessão. Onde cada par está é dado de operação da loja. A vitrine mostra ao cliente apenas o total, que já vem no campo `quantidade` do produto.

---

## Esquema do banco

O arquivo `.db` não é versionado. A estrutura vive em `db/schema.sql`, os índices em `db/indexes.sql` e os dados iniciais em `db/seed.sql`. Rode `npm run db:setup` para criar ou atualizar o banco.

### `produtos`

| Coluna           | Tipo    | O que guarda                                                               |
| ---------------- | ------- | -------------------------------------------------------------------------- |
| `id`             | inteiro | Chave primária, gerada pelo banco.                                         |
| `nome`           | texto   | Nome do calçado.                                                           |
| `numeracao`      | texto   | Texto, e não número, porque há faixas como `35/36`.                        |
| `categoria`      | texto   | O **tipo** do calçado: `Botina`, `Sapato social`, `Sandália`.              |
| `publico`        | texto   | Para **quem** o calçado é: `Masculino`, `Feminino`, `Infantil`, `Unissex`. |
| `quantidade`     | inteiro | Total desnormalizado. Ver a nota abaixo.                                   |
| `status_estoque` | texto   | `Em estoque` ou `Sem estoque`. Derivado do total.                          |
| `marca`, `cor`   | texto   | Dados que a vitrine mostra ao cliente.                                     |
| `descricao`      | texto   | Texto do produto na vitrine.                                               |
| `imagem_url`     | texto   | Foto. Nulo faz a tela mostrar um marcador.                                 |
| `nome_ordenacao` | texto   | Nome sem acento e em minúscula. Serve só para ordenar.                     |
| `subcategoria`   | texto   | Coluna herdada. Nada a preenche. Ver as limitações.                        |

`categoria` e `publico` são colunas separadas de propósito. Antes dessa separação, a mesma coluna misturava as duas coisas: alguns produtos diziam `Esporte` ou `Masculino`, e outros diziam `Botina` ou `Sandália`. A vitrine então precisava adivinhar o público com uma lista de palavras-chave. Com as duas colunas, o filtro é igualdade exata.

### `estoque`

Saldo por unidade da loja.

| Coluna       | Tipo    | O que guarda                                        |
| ------------ | ------- | --------------------------------------------------- |
| `produto_id` | inteiro | Aponta para `produtos.id`, com `ON DELETE CASCADE`. |
| `unidade`    | texto   | `Matriz` ou `Filial`.                               |
| `quantidade` | inteiro | Saldo naquela unidade.                              |

A chave primária é o par `(produto_id, unidade)`.

**Sobre `produtos.quantidade`.** Ela continua existindo, como total desnormalizado, e é recalculada dentro da mesma transação da movimentação. O motivo de manter as duas: a listagem paginada ordena por quantidade, e um `SUM` com `JOIN` em toda página custaria caro sem ganho. Um teste confere que o total nunca diverge da soma do `estoque`.

### `movimentacoes`

| Coluna       | Tipo    | O que guarda                                        |
| ------------ | ------- | --------------------------------------------------- |
| `id`         | inteiro | Chave primária.                                     |
| `produto_id` | inteiro | Aponta para `produtos.id`, com `ON DELETE CASCADE`. |
| `unidade`    | texto   | Onde a movimentação aconteceu.                      |
| `tipo`       | texto   | `entrada` ou `saida`.                               |
| `quantidade` | inteiro | Sempre positiva. O tipo é que dá o sinal.           |
| `motivo`     | texto   | Texto livre. Pode ser nulo.                         |
| `criado_em`  | texto   | ISO 8601, em UTC.                                   |

As chaves estrangeiras só valem com `PRAGMA foreign_keys = ON`, porque o SQLite desliga a checagem por padrão em cada conexão. O projeto liga o PRAGMA em `src/config/db.js` e em `db/setup.js`.

### Migração do saldo por unidade

> **Atenção, e isto precisa de conferência do time.**
>
> O banco anterior guardava um número só em `produtos.quantidade`, e não dizia de qual loja ele era. A migração põe **todo** esse saldo na **Matriz** e deixa a Filial em zero, com uma movimentação de motivo `Saldo migrado`.
>
> Isso é uma escolha, e não um fato. Confira o saldo real de cada loja e mova o que estiver no lugar errado com `POST /produtos/:id/movimentacoes`, antes de confiar nos números do painel.

A migração é idempotente. Rodar `npm run db:setup` duas vezes não duplica saldo nem movimentação.

---

## Execução de Testes

O projeto tem **167 testes automatizados**: 136 no backend e 31 no painel.

### Backend

```bash
npm test              # roda uma vez
npm run test:watch
npm run test:coverage # roda e aplica o piso de cobertura
```

| Arquivo                            | O que cobre                                                        |
| ---------------------------------- | ------------------------------------------------------------------ |
| `tests/smoke.test.js`              | O app carrega, `/health` responde, `/produtos` devolve o envelope. |
| `tests/produtos.test.js`           | As rotas de leitura pela camada HTTP, com os casos de erro.        |
| `tests/produtoModel.test.js`       | Os caminhos de `buscar` e a validação de `adicionar`.              |
| `tests/produtosCrud.test.js`       | Filtro, ordenação, paginação, editar e remover.                    |
| `tests/seed.test.js`               | A carga inicial e a coerência dos dados.                           |
| `tests/auth.test.js`               | Login, sessão, cookie adulterado e o guarda das rotas de escrita.  |
| `tests/authNaoConfigurada.test.js` | O `503` quando falta variável de ambiente.                         |
| `tests/estoque.test.js`            | Saldo por unidade, abertura na migração e remoção em cascata.      |
| `tests/movimentacoes.test.js`      | Entrada, saída, saldo negativo, transação e histórico.             |

Cada arquivo de teste cria o seu próprio banco temporário, a partir dos mesmos `db/schema.sql`, `db/indexes.sql` e `db/seed.sql` que o `npm run db:setup` usa. Nenhum teste toca o banco de desenvolvimento.

### Painel

```bash
cd painel-estoque
npm test
npm run test:coverage
```

Os testes do painel cobrem duas camadas. O `App.test.jsx` substitui o módulo da API por dublês e confere a tela. O `api.test.js` substitui o `fetch` e confere o contrato com o backend: método, caminho, query, credencial e a tradução do erro.

### Cobertura

A CI aplica um piso de cobertura nos dois pacotes. Um pacote abaixo do piso reprova a execução.

| Pacote           | Linhas | Comandos | Funções | Ramos |
| ---------------- | ------ | -------- | ------- | ----- |
| Raiz (backend)   | 95     | 95       | 95      | 85    |
| `painel-estoque` | 95     | 95       | 95      | 90    |

O piso sai da medição real, arredondada para baixo até o múltiplo de 5, e limitada em 95. A regra é grosseira de propósito. Um piso colado na medição falha a cada ponto de oscilação e vira ruído. Um piso de 100 transforma toda função nova em falha antes de o teste dela entrar.

**Não baixe o piso para fazer a CI passar.** Ele existe para avisar que a cobertura caiu.

### Verificações da integração contínua

O arquivo `.github/workflows/ci.yml` roda tudo no **Node 22 e 24**, a cada push em qualquer branch e a cada pull request.

| Onde   | Comandos                                                                            |
| ------ | ----------------------------------------------------------------------------------- |
| Raiz   | `npm run lint`, `npm run format:check`, `npm run db:setup`, `npm run test:coverage` |
| Raiz   | Um smoke test contra o servidor de verdade, com `curl`                              |
| Painel | `npm run lint`, `npm run test:coverage`, `npm run build`                            |

O smoke test sorteia uma senha, gera o hash, sobe o servidor de verdade e exercita o caminho completo: leitura pública, `400` na busca sem `tipo`, `401` na escrita sem sessão, login com senha errada e com a certa, cadastro, `400` no `PUT` com quantidade, movimentação, saída maior que o saldo e o histórico.

Rode os mesmos comandos antes de abrir um pull request. Veja o [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Estrutura de Diretórios

```
calcados-mariano/
├── server.js                       # Entrada do backend. Só abre a porta.
├── package.json                    # Dependências, scripts e metadados do backend.
├── .env.example                    # Variáveis de ambiente, com o valor padrão de cada uma.
│                                   # (calcados_mariano.db não é versionado. Rode npm run db:setup.)
│
├── db/                             # Definição do banco de dados.
│   ├── schema.sql                  # Tabelas produtos, estoque e movimentacoes.
│   ├── indexes.sql                 # Índices. Separado porque rodam depois da migração.
│   ├── seed.sql                    # Dezesseis calçados de exemplo.
│   ├── estoque-inicial.js          # Abre o saldo por unidade. Usado pelo setup e pelos testes.
│   ├── hash-senha.js               # Gera o hash scrypt da senha do painel.
│   └── setup.js                    # Cria e migra o banco a partir dos arquivos acima.
│
├── src/                            # Código do backend, separado por camada.
│   ├── app.js                      # Monta o Express, os middlewares e as rotas. Não abre porta.
│   ├── auth/sessao.js              # Assina e confere o token. Lê e escreve o cookie.
│   ├── middlewares/
│   │   └── exigirAutenticacao.js   # Guarda das rotas que exigem sessão.
│   ├── config/
│   │   ├── db.js                   # Abre a conexão SQLite. Liga as chaves estrangeiras.
│   │   └── unidades.js             # As unidades da loja. Sem dependência de banco.
│   ├── routes/                     # healthRoutes, authRoutes e produtoRoutes.
│   ├── controllers/                # HealthController, AuthController e ProdutoController.
│   └── models/
│       ├── HealthModel.js          # Consulta a tabela para provar que o banco responde.
│       ├── ProdutoModel.js         # Consultas e validação do produto.
│       ├── EstoqueModel.js         # Saldo por unidade e recálculo do total.
│       ├── MovimentacaoModel.js    # Entrada, saída e histórico.
│       ├── transacao.js            # Consulta com promessa e transação com fila.
│       └── erros.js                # As marcas que o controller traduz em 400 e 404.
│
├── tests/                          # Testes do backend, com Vitest e Supertest.
│   └── helpers/                    # Banco temporário e sessão de teste.
│
├── painel-estoque/                 # Projeto npm separado. O painel em React.
│   └── src/
│       ├── App.jsx                 # Compõe a tela e guarda o estado.
│       ├── config.js               # URL da API, limites, públicos e unidades.
│       ├── api/produtos.js         # Cliente HTTP da API de estoque.
│       ├── components/             # Header, BuscaForm, EstoqueTable, EstoqueRow,
│       │                           # ProdutoForm e Footer.
│       └── __tests__/              # Testes da tela e do cliente HTTP.
│
├── .github/workflows/ci.yml        # Integração contínua.
└── docs/ROADMAP.md                 # Plano técnico priorizado.
```

O backend segue uma separação em camadas. A rota recebe a URL, o controller trata o HTTP e o model fala com o banco. Uma camada só chama a camada abaixo dela. O model marca o erro com `validacao` ou `naoEncontrado`, e o controller traduz essas marcas em `400` e `404`. Assim o model não conhece HTTP e o controller não conhece SQL.

O `server.js` e o `src/app.js` têm papéis separados de propósito. O `app.js` monta o Express e exporta o app, sem abrir porta. O `server.js` importa esse app e chama `listen`. Essa divisão permite que um teste importe o app e chame as rotas sem ocupar a porta 3000.

---

## Limitações Conhecidas

Esta lista descreve o estado real do código. O arquivo [`docs/ROADMAP.md`](docs/ROADMAP.md) traz o plano com prioridades.

| #   | Limitação                                                                                                                     | Impacto                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | A migração pôs **todo** o saldo antigo na Matriz. Ninguém conferiu o saldo real de cada loja.                                 | Alto. Os números por unidade não valem até essa conferência.    |
| 2   | O sistema tem **um credencial só**, do dono da loja. Não há conta por usuário, e o histórico não diz quem fez a movimentação. | Médio. O rastro diz o que mudou, e não quem mudou.              |
| 3   | O painel ainda não tem tela para editar, remover, nem para registrar movimentação. As rotas existem e têm teste.              | Médio. Essas operações hoje pedem `curl`.                       |
| 4   | Não existe vitrine pública nesta branch. A tela atual serve o dono da loja.                                                   | Médio. A vitrine é o caminho do cliente até a loja.             |
| 5   | A tabela `produtos` tem a coluna `subcategoria`, e nada a preenche.                                                           | Baixo. Coluna morta no esquema.                                 |
| 6   | Os dados da loja ficam em `painel-estoque/src/config.js`, e não em variável de ambiente.                                      | Baixo. Precisa sair do código antes de qualquer publicação.     |
| 7   | O `status_estoque` aceita texto livre no cadastro. A movimentação o sobrescreve com o valor derivado do saldo.                | Baixo. Um valor próprio não sobrevive à primeira movimentação.  |
| 8   | O banco é um arquivo SQLite, sem cópia de segurança automática.                                                               | Médio em produção. Uma perda de arquivo é uma perda de estoque. |

## Licença

**Este projeto não tem licença definida.** O repositório não traz um arquivo `LICENSE`. O `package.json` declara `"license": "UNLICENSED"` e `"private": true`, que é a forma de dizer que nenhuma licença foi concedida.

Sem uma licença explícita, ninguém tem permissão de uso, cópia ou distribuição deste código. Trate o repositório como privado.

O código traz dados reais da loja, entre eles os telefones das duas unidades. O time precisa decidir o licenciamento antes de qualquer publicação. O item está registrado como decisão pendente em [`docs/ROADMAP.md`](docs/ROADMAP.md).
