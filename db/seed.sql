-- Carga inicial da tabela produtos.
--
-- Estes produtos vêm do banco do repositório original, no commit 6f4aaa37, que
-- tinha 17 linhas com marca, cor e descrição preenchidas. Três correções foram
-- aplicadas na adoção:
--
--   1. A categoria virou o TIPO do calçado, e o público saiu para a coluna
--      publico. No banco antigo, 6 produtos diziam 'Esporte' ou 'Masculino' e
--      11 diziam 'Botina', 'Sandália' e afins, na mesma coluna.
--   2. O status_estoque foi derivado da quantidade. O banco antigo misturava
--      'Em estoque', 'Disponível' e 'Em estoque ' com espaço no fim.
--   3. O produto 'Tênis Exemplo Direto' saiu, porque era dado de teste.
--
-- A descrição era a mesma frase nos 17 produtos. Cada um recebeu um texto
-- próprio, porque a vitrine mostra esse campo ao cliente.
--
-- A coluna imagem_url fica nula. Nenhuma foto existe ainda, e a vitrine mostra
-- um marcador local quando o campo é nulo.

DELETE FROM produtos;

INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Chuteira Nike Beco 2', '37', 'Chuteira de futsal', 'Unissex', NULL, 15, 'Em estoque', 'Nike', 'Azul', 'Chuteira de futsal com solado liso, indicada para quadra.', NULL, 'chuteira nike beco 2');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Sapato Social Preto', '40', 'Sapato social', 'Masculino', NULL, 15, 'Em estoque', 'Mariano', 'Preto', 'Sapato social de couro, para trabalho e eventos formais.', NULL, 'sapato social preto');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Bota Texana Bico Quadrado', '41', 'Bota texana', 'Masculino', NULL, 8, 'Em estoque', 'Mariano', 'Única', 'Bota texana de bico quadrado, com salto tradicional.', NULL, 'bota texana bico quadrado');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Botina Zebu', '39', 'Botina', 'Masculino', NULL, 12, 'Em estoque', 'Zebu', 'Única', 'Botina de couro com elástico lateral, para uso diário e trabalho.', NULL, 'botina zebu');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Tênis Casual Branco', '38', 'Tênis casual', 'Unissex', NULL, 20, 'Em estoque', 'Mariano', 'Branco', 'Tênis casual branco, combina com jeans e roupa leve.', NULL, 'tenis casual branco');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Tênis Esportivo de Corrida', '42', 'Tênis esportivo', 'Unissex', NULL, 25, 'Em estoque', 'Mariano', 'Única', 'Tênis de corrida com entressola amortecida e cabedal respirável.', NULL, 'tenis esportivo de corrida');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Chuteira de Campo Trava Alta', '40', 'Chuteira de campo', 'Unissex', NULL, 18, 'Em estoque', 'Mariano', 'Única', 'Chuteira de campo com trava alta, para gramado natural.', NULL, 'chuteira de campo trava alta');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Chuteira Society Grama Sintética', '41', 'Chuteira society', 'Unissex', NULL, 22, 'Em estoque', 'Mariano', 'Única', 'Chuteira society com trava baixa, para grama sintética.', NULL, 'chuteira society grama sintetica');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Sapatênis Marrom', '39', 'Sapatênis', 'Masculino', NULL, 10, 'Em estoque', 'Mariano', 'Marrom', 'Sapatênis marrom, meio caminho entre o social e o casual.', NULL, 'sapatenis marrom');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Sapatilha Bico Fino', '36', 'Sapatilha', 'Feminino', NULL, 14, 'Em estoque', 'Mariano', 'Única', 'Sapatilha de bico fino, leve e fácil de calçar.', NULL, 'sapatilha bico fino');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Rasteirinha Básica', '35/36', 'Rasteirinha', 'Feminino', NULL, 30, 'Em estoque', 'Mariano', 'Única', 'Rasteirinha básica, confortável para o dia a dia.', NULL, 'rasteirinha basica');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Sandália de Salto', '37', 'Sandália', 'Feminino', NULL, 11, 'Em estoque', 'Mariano', 'Única', 'Sandália de salto médio, para ocasiões sociais.', NULL, 'sandalia de salto');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Tamanco Plataforma', '38', 'Tamanco', 'Feminino', NULL, 7, 'Em estoque', 'Mariano', 'Única', 'Tamanco de plataforma, com apoio firme.', NULL, 'tamanco plataforma');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Tênis Esportivo Nike Revolution', '40', 'Tênis esportivo', 'Unissex', NULL, 10, 'Em estoque', 'Nike', 'Única', 'Tênis esportivo Nike Revolution, para caminhada e corrida leve.', NULL, 'tenis esportivo nike revolution');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Sapato Social Masculino de Couro', '42', 'Sapato social', 'Masculino', NULL, 5, 'Em estoque', 'Mariano', 'Única', 'Sapato social masculino em couro, com solado costurado.', NULL, 'sapato social masculino de couro');
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url, nome_ordenacao)
  VALUES ('Sandália Feminina Casual Confortável', '37', 'Sandália', 'Feminino', NULL, 8, 'Em estoque', 'Mariano', 'Única', 'Sandália feminina casual, com palmilha macia.', NULL, 'sandalia feminina casual confortavel');
