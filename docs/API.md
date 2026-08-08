# Referência da API

Esta é a parte técnica, para quem mantém o sistema. Quem só usa não precisa
dela — o guia de uso está no [README](../README.md).

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
