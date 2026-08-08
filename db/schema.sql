-- Esquema do banco da Calçados Mariano.
--
-- Este arquivo é a fonte da estrutura do banco. O arquivo .db não é versionado.
-- Para criar ou atualizar o banco, rode: npm run db:setup
--
-- Sobre as duas colunas de classificação:
--
--   categoria  guarda o TIPO do calçado. Exemplos: 'Sapato social', 'Botina',
--              'Chuteira de campo'.
--   publico    guarda para QUEM o calçado é. Exemplos: 'Masculino', 'Feminino',
--              'Infantil', 'Unissex'.
--
-- Antes desta separação, a coluna categoria misturava as duas coisas: alguns
-- produtos diziam 'Esporte' ou 'Masculino' e outros diziam 'Botina' ou 'Sandália'.
-- A vitrine então precisava adivinhar o público com uma lista de palavras-chave.
-- Com as duas colunas, o filtro da vitrine é igualdade exata.
--
-- Os valores aceitos em publico vivem em src/models/ProdutoModel.js, na tabela
-- PUBLICOS. O model valida antes de gravar.

CREATE TABLE IF NOT EXISTS produtos (
    -- INTEGER PRIMARY KEY no SQLite é apelido de rowid, portanto o id é gerado
    -- pelo banco quando o INSERT não informa um valor.
    id             INTEGER PRIMARY KEY,
    nome           TEXT,
    numeracao      TEXT,    -- Texto, e não número, porque há faixas como '35/36'
    categoria      TEXT,    -- Tipo do calçado
    publico        TEXT,    -- Masculino, Feminino, Infantil ou Unissex
    subcategoria   TEXT,
    quantidade     INTEGER,
    status_estoque TEXT,
    marca          TEXT,
    cor            TEXT,
    descricao      TEXT,
    imagem_url     TEXT,    -- Foto do produto na vitrine. Nulo mostra um marcador

    -- Nome sem acento e em minúscula, usado só para ordenar.
    --
    -- O SQLite não tem colação por idioma. COLLATE NOCASE dobra apenas ASCII, portanto
    -- 'Sapatênis' cairia depois de 'Sapato', porque o ponto de código de 'ê' é maior que
    -- o de 'o'. Num catálogo em português quase todo nome tem acento, e a lista sairia
    -- fora de ordem para quem olha. Esta coluna é preenchida na escrita.
    nome_ordenacao TEXT
);

-- Saldo por unidade da loja.
--
-- A loja tem mais de um ponto de venda, e antes desta tabela o sistema guardava um
-- número só. Quem olhava a tela não sabia em qual loja o par estava, portanto a
-- resposta ao cliente dependia de uma ligação telefônica.
--
-- produtos.quantidade continua existindo, como total desnormalizado. Ela é recalculada
-- dentro da mesma transação da movimentação, e um teste confere que ela nunca diverge
-- da soma desta tabela. O motivo de manter as duas: a listagem paginada ordena por
-- quantidade, e um SUM com JOIN em toda página custaria caro sem ganho.
--
-- Os valores aceitos em unidade vivem em src/config/unidades.js.
CREATE TABLE IF NOT EXISTS estoque (
    produto_id INTEGER NOT NULL,
    unidade    TEXT    NOT NULL,   -- 'Matriz' ou 'Filial'
    quantidade INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (produto_id, unidade),
    FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE
);

-- Histórico de entrada e saída.
--
-- Toda mudança de saldo passa por aqui. O PUT do produto NÃO altera a quantidade, de
-- propósito: se alterasse, o saldo mudaria sem deixar rastro e o histórico teria furo.
--
-- A chave estrangeira só vale com PRAGMA foreign_keys = ON, porque o SQLite desliga a
-- checagem por padrão. O PRAGMA está em src/config/db.js e em db/setup.js.
CREATE TABLE IF NOT EXISTS movimentacoes (
    id         INTEGER PRIMARY KEY,
    produto_id INTEGER NOT NULL,
    unidade    TEXT    NOT NULL,
    tipo       TEXT    NOT NULL,   -- 'entrada' ou 'saida'
    quantidade INTEGER NOT NULL,   -- Sempre positiva. O tipo é que dá o sinal
    motivo     TEXT,
    criado_em  TEXT    NOT NULL,   -- ISO 8601 em UTC

    FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE
);
