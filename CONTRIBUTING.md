# Como contribuir

Este projeto é o sistema de controle de estoque da Calçados Mariano. O repositório é privado e não tem licença. Veja a seção de licença no [README](README.md).

## Preparar o ambiente

1. Instale o Node.js na versão do arquivo `.nvmrc`.
2. Instale as dependências do backend e crie o banco:

   ```bash
   npm install
   npm run db:setup
   ```

3. Instale as dependências do frontend:

   ```bash
   cd painel-estoque && npm install
   ```

## Antes de abrir um pull request

Rode as mesmas verificações que a CI roda. Se qualquer uma falhar, a CI também falha.

Na raiz:

```bash
npm run lint
npm run format:check
npm test
```

Em `painel-estoque/`:

```bash
npm run lint
npm test
npm run build
```

O comando `npm run format` corrige a formatação, e o `npm run lint:fix` corrige o que o ESLint consegue.

## Branches

Crie um branch a partir da `main`. Use um nome que diga o que a mudança faz.

```
feat/cadastro-por-lote
fix/busca-sem-tipo
docs/atualiza-readme
```

## Commits

Escreva a mensagem em português. Use um prefixo que diga o tipo da mudança.

| Prefixo     | Quando usar                                 |
| ----------- | ------------------------------------------- |
| `feat:`     | Comportamento novo para quem usa o sistema. |
| `fix:`      | Correção de defeito.                        |
| `refactor:` | Muda o código sem mudar o comportamento.    |
| `test:`     | Adiciona ou ajusta teste.                   |
| `docs:`     | Muda só documentação.                       |
| `chore:`    | Dependência, configuração, ferramenta.      |

A primeira linha tem no máximo 72 caracteres. O corpo explica **por que** a mudança existe, e não só o que mudou.

## Regras que o time segue

1. **Toda correção de defeito ganha um teste que falha sem ela.** O item P0-1 do roadmap corrigiu uma falha que derrubava o servidor, e hoje um teste guarda essa correção.
2. **A documentação muda no mesmo pull request que o código.** Documentação desatualizada engana mais do que documentação ausente.
3. **O arquivo do banco não entra no Git.** A estrutura fica em `db/schema.sql` e os dados de exemplo em `db/seed.sql`.
4. **Nenhum dado real da loja em componente.** Telefones e nomes ficam em `painel-estoque/src/config.js`.
5. **Nada de segredo no repositório.** Use `.env`, que é ignorado, e documente a variável em `.env.example`.

## Onde encontrar o quê

O [README](README.md) descreve a arquitetura, as rotas da API e como rodar o projeto. O [roadmap](docs/ROADMAP.md) lista o que falta fazer, em ordem de prioridade, com o critério de aceite de cada item.
