-- Carga inicial da tabela produtos.
-- Estes são os 13 calçados que estavam no banco versionado, antes de o arquivo
-- calcados_mariano.db sair do controle de versão.
--
-- Os valores de texto passaram por trim. O banco antigo tinha a categoria
-- 'Tênis de Futsal\r\n' e o status 'Em estoque ', e esses espaços quebram
-- qualquer filtro por igualdade exata.

DELETE FROM produtos;

INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (1, 'Chuteira Nike Beco 2', '37', 'Tênis de Futsal', NULL, 15, 'Em estoque', NULL, NULL, NULL);
INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (2, 'Sapato Social Preto', '40', 'Sapato', NULL, 15, 'Em estoque', NULL, NULL, NULL);
INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (3, 'Bota Texana Bico Quadrado', '41', 'Bota (texana)', NULL, 8, 'Em estoque', NULL, NULL, NULL);
INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (4, 'Botina Zebu', '39', 'Botina', NULL, 12, 'Em estoque', NULL, NULL, NULL);
INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (5, 'Tênis Casual Branco', '38', 'Tênis (social e esportivo)', NULL, 20, 'Em estoque', NULL, NULL, NULL);
INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (6, 'Tênis Esportivo de Corrida', '42', 'Tênis (social e esportivo)', NULL, 25, 'Em estoque', NULL, NULL, NULL);
INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (7, 'Chuteira de Campo Trava Alta', '40', 'Chuteira (campo e society)', NULL, 18, 'Em estoque', NULL, NULL, NULL);
INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (8, 'Chuteira Society Grama Sintética', '41', 'Chuteira (campo e society)', NULL, 22, 'Em estoque', NULL, NULL, NULL);
INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (9, 'Sapatênis Marrom', '39', 'Sapatênis', NULL, 10, 'Em estoque', NULL, NULL, NULL);
INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (10, 'Sapatilha Bico Fino', '36', 'Sapatilha', NULL, 14, 'Em estoque', NULL, NULL, NULL);
INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (11, 'Rasteirinha Básica', '35/36', 'Rasteirinha', NULL, 30, 'Em estoque', NULL, NULL, NULL);
INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (12, 'Sandália de Salto', '37', 'Sandália', NULL, 11, 'Em estoque', NULL, NULL, NULL);
INSERT INTO produtos (id, nome, numeracao, categoria, subcategoria, quantidade, status_estoque, marca, cor, descricao) VALUES (13, 'Tamanco Plataforma', '38', 'Tamanco', NULL, 7, 'Em estoque', NULL, NULL, NULL);
