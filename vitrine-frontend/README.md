# vitrine-frontend

A interface web da Calçados Mariano. React 19 com Vite.

O nome da pasta vem da primeira versão do projeto, que era uma vitrine de produtos. O objetivo atual é outro. Esta interface vai virar o painel de administração do estoque, que lê e escreve pela API. Veja o item P2-1 em [`docs/ROADMAP.md`](../docs/ROADMAP.md).

Este pacote é uma parte do projeto. A documentação completa fica no [README da raiz](../README.md).

## Comandos

Instale as dependências antes do primeiro uso:

```bash
npm install
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento em `http://localhost:5173`. |
| `npm run build` | Gera a versão de produção na pasta `dist/`. |
| `npm run preview` | Serve a pasta `dist/` para conferência local. |
| `npm run lint` | Roda o ESLint em todo o pacote. |

Este pacote não chama o backend hoje. A lista de produtos é a constante `produtosMock` em `src/App.jsx`. Você roda a interface sem iniciar o servidor.

Os campos que a tela mostra hoje (`preco`, `imagem_url`, `tamanhos`) não existem na tabela `produtos`. Os campos do estoque (`quantidade`, `status_estoque`, `numeracao`) não aparecem na tela. A conversão da página em painel de estoque resolve as duas coisas.

## Arquivos

| Caminho | Conteúdo |
| --- | --- |
| `src/main.jsx` | Ponto de entrada. Monta o componente `App`. |
| `src/App.jsx` | Toda a interface, em um componente. |
| `src/App.css` | Estilos da vitrine. |
| `vite.config.js` | Configuração do Vite. |
| `eslint.config.js` | Regras do ESLint. |

O plano de refatoração deste pacote está em [`docs/ROADMAP.md`](../docs/ROADMAP.md).
