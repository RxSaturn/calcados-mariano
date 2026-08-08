-- Índices, aplicados DEPOIS da migração de colunas.
--
-- Este arquivo é separado do schema.sql de propósito. Um banco criado por uma
-- versão anterior não tem a coluna publico, e CREATE INDEX ON produtos(publico)
-- falha com "no such column" se rodar antes do ALTER TABLE. A ordem no
-- db/setup.js é: criar a tabela, migrar as colunas, criar os índices.

-- A vitrine filtra por publico e por categoria, e busca por numeração exata.
CREATE INDEX IF NOT EXISTS idx_produtos_numeracao ON produtos (numeracao);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos (categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_publico ON produtos (publico);

-- A listagem ordena por este campo por padrão.
CREATE INDEX IF NOT EXISTS idx_produtos_nome_ordenacao ON produtos (nome_ordenacao);

-- O histórico de um produto sai do mais recente para o mais antigo. A tabela estoque
-- não precisa de índice próprio, porque a chave primária já começa por produto_id.
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto ON movimentacoes (produto_id, id DESC);
