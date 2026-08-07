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
    imagem_url     TEXT     -- Foto do produto na vitrine. Nulo mostra um marcador
);
