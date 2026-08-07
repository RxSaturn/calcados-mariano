-- Esquema do banco de estoque da Calçados Mariano.
--
-- Este arquivo é a fonte da estrutura do banco. Antes do item P0-2 do roadmap,
-- a estrutura existia apenas dentro do arquivo binário calcados_mariano.db, que
-- era versionado no Git.
--
-- Para criar o banco, rode: npm run db:setup

CREATE TABLE IF NOT EXISTS produtos (
    -- INTEGER PRIMARY KEY no SQLite é apelido de rowid, portanto o id é gerado
    -- pelo banco quando o INSERT não informa um valor.
    id             INTEGER PRIMARY KEY,
    nome           TEXT,
    numeracao      TEXT,    -- Texto, e não número, porque há faixas como '35/36'
    categoria      TEXT,
    subcategoria   TEXT,
    quantidade     INTEGER,
    status_estoque TEXT,
    marca          TEXT,
    cor            TEXT,
    descricao      TEXT
);

-- A busca por nome e por categoria usa LIKE, e a busca por numeração usa
-- igualdade. Estes índices ajudam a numeração e a categoria.
CREATE INDEX IF NOT EXISTS idx_produtos_numeracao ON produtos (numeracao);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos (categoria);
