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

INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Chuteira Nike Beco 2', '37', 'Chuteira de futsal', 'Unissex', NULL, 15, 'Em estoque', 'Nike', 'Azul', 'Chuteira de futsal com solado liso, indicada para quadra.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Sapato Social Preto', '40', 'Sapato social', 'Masculino', NULL, 15, 'Em estoque', 'Mariano', 'Preto', 'Sapato social de couro, para trabalho e eventos formais.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Bota Texana Bico Quadrado', '41', 'Bota texana', 'Masculino', NULL, 8, 'Em estoque', 'Mariano', 'Única', 'Bota texana de bico quadrado, com salto tradicional.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Botina Zebu', '39', 'Botina', 'Masculino', NULL, 12, 'Em estoque', 'Zebu', 'Única', 'Botina de couro com elástico lateral, para uso diário e trabalho.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Tênis Casual Branco', '38', 'Tênis casual', 'Unissex', NULL, 20, 'Em estoque', 'Mariano', 'Branco', 'Tênis casual branco, combina com jeans e roupa leve.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Tênis Esportivo de Corrida', '42', 'Tênis esportivo', 'Unissex', NULL, 25, 'Em estoque', 'Mariano', 'Única', 'Tênis de corrida com entressola amortecida e cabedal respirável.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Chuteira de Campo Trava Alta', '40', 'Chuteira de campo', 'Unissex', NULL, 18, 'Em estoque', 'Mariano', 'Única', 'Chuteira de campo com trava alta, para gramado natural.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Chuteira Society Grama Sintética', '41', 'Chuteira society', 'Unissex', NULL, 22, 'Em estoque', 'Mariano', 'Única', 'Chuteira society com trava baixa, para grama sintética.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Sapatênis Marrom', '39', 'Sapatênis', 'Masculino', NULL, 10, 'Em estoque', 'Mariano', 'Marrom', 'Sapatênis marrom, meio caminho entre o social e o casual.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Sapatilha Bico Fino', '36', 'Sapatilha', 'Feminino', NULL, 14, 'Em estoque', 'Mariano', 'Única', 'Sapatilha de bico fino, leve e fácil de calçar.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Rasteirinha Básica', '35/36', 'Rasteirinha', 'Feminino', NULL, 30, 'Em estoque', 'Mariano', 'Única', 'Rasteirinha básica, confortável para o dia a dia.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Sandália de Salto', '37', 'Sandália', 'Feminino', NULL, 11, 'Em estoque', 'Mariano', 'Única', 'Sandália de salto médio, para ocasiões sociais.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Tamanco Plataforma', '38', 'Tamanco', 'Feminino', NULL, 7, 'Em estoque', 'Mariano', 'Única', 'Tamanco de plataforma, com apoio firme.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Tênis Esportivo Nike Revolution', '40', 'Tênis esportivo', 'Unissex', NULL, 10, 'Em estoque', 'Nike', 'Única', 'Tênis esportivo Nike Revolution, para caminhada e corrida leve.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Sapato Social Masculino de Couro', '42', 'Sapato social', 'Masculino', NULL, 5, 'Em estoque', 'Mariano', 'Única', 'Sapato social masculino em couro, com solado costurado.', NULL);
INSERT INTO produtos (nome, numeracao, categoria, publico, subcategoria, quantidade, status_estoque, marca, cor, descricao, imagem_url)
  VALUES ('Sandália Feminina Casual Confortável', '37', 'Sandália', 'Feminino', NULL, 8, 'Em estoque', 'Mariano', 'Única', 'Sandália feminina casual, com palmilha macia.', NULL);
