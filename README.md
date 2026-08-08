# Calçados Mariano

Sistema de estoque e vitrine da Calçados Mariano, em Bambuí (MG).

O sistema tem **duas telas**, para duas pessoas diferentes:

| Tela          | Para quem                | O que faz                                                            |
| :------------ | :----------------------- | :------------------------------------------------------------------- |
| **A vitrine** | o cliente que vem da rua | mostra os calçados que a loja tem, e leva a conversa para o WhatsApp |
| **O painel**  | quem cuida do estoque    | cadastra, edita e remove calçados, e avisa o que está acabando       |

A vitrine é aberta. O painel pede senha.

---

## Sumário

- [Como instalar](#como-instalar)
- [Como usar todo dia](#como-usar-todo-dia)
- [Guia do painel](#guia-do-painel)
- [Cópia de segurança](#cópia-de-segurança)
- [Quando alguma coisa dá errado](#quando-alguma-coisa-dá-errado)
- [Para quem mantém o sistema](#para-quem-mantém-o-sistema)

---

## Como instalar

Isso é feito **uma vez**, no computador que vai ficar com o sistema.

Antes, instale o **Node.js 22 ou mais novo**, de [nodejs.org](https://nodejs.org).
Ele é o programa que faz o sistema funcionar.

Depois, abra o terminal na pasta do sistema e digite:

```bash
npm run instalar
```

O programa faz o resto sozinho e vai perguntar **uma senha** — é a senha do
painel de estoque. Escolha uma que você lembre, com pelo menos 10 letras. Ela
não aparece na tela enquanto você digita, e isso é de propósito.

> **Guarde essa senha.** Ela não fica escrita em lugar nenhum: o sistema guarda
> só um cálculo dela, que não permite voltar à senha original. Perdendo a senha,
> a saída é rodar a instalação de novo para definir outra.

Quando terminar, ele mostra o endereço do sistema.

---

## Como usar todo dia

### Ligar

Dê dois cliques em **`deploy/iniciar-sistema.bat`**.

Uma janela preta abre — **essa janela é o sistema**. Enquanto ela estiver
aberta, o site funciona. Fechar a janela desliga tudo.

O navegador abre sozinho na vitrine.

> **Para o sistema ligar junto com o computador:** aperte a tecla Windows + R,
> digite `shell:startup`, dê Enter, e copie o `iniciar-sistema.bat` para a pasta
> que abrir.

### Os dois endereços

| Endereço                      | O que é                    |
| :---------------------------- | :------------------------- |
| `http://localhost:3000`       | a vitrine                  |
| `http://localhost:3000/admin` | o painel, que pede a senha |

---

## Guia do painel

Abra `http://localhost:3000/admin` e digite a senha da instalação.

### A tabela

Ela lista tudo o que a loja tem cadastrado. As linhas de **estoque baixo ficam
destacadas** — é o principal motivo de o sistema existir: avisar antes de
faltar.

No alto, dois números: quantos produtos existem e quantos estão acabando.

### Cadastrar um calçado

Preencha o formulário e clique em **Cadastrar**:

| Campo      | O que pôr                                                           |
| :--------- | :------------------------------------------------------------------ |
| Nome       | como o calçado é conhecido, por exemplo "Bota Texana Bico Quadrado" |
| Categoria  | o tipo: Bota, Chuteira, Sandália, Tênis                             |
| Público    | Masculino, Feminino, Infantil ou Unissex                            |
| Numeração  | o número, por exemplo `41`                                          |
| Quantidade | quantos pares existem                                               |
| Situação   | Em estoque ou Esgotado                                              |

Se algum campo estiver errado, o sistema diz qual e por quê, e nada é gravado.

### Corrigir um calçado

Na linha do produto, clique em **Editar**. O formulário abre já preenchido.
Mude o que precisa e clique em **Salvar**. Para desistir, clique em Cancelar.

### Tirar um calçado da lista

Na linha do produto, clique em **Remover**. O sistema pergunta se é isso mesmo,
ali na própria linha, antes de apagar. Só depois de clicar em **Sim, remover** o
produto sai.

> Remover apaga o produto de vez. Se o calçado só acabou, é melhor deixar a
> quantidade em zero: ele continua na vitrine marcado como esgotado, e o cliente
> vê que a loja trabalha com aquele modelo.

### Procurar

Use a busca por nome, categoria ou numeração. O botão **Mostrar tudo** volta
para a lista completa.

### Sair

O botão **Sair**, no alto. Faça isso quando deixar o computador.

A sessão dura oito horas. Depois disso o sistema pede a senha de novo — se isso
acontecer no meio de um cadastro, é só entrar e refazer.

---

## Cópia de segurança

**Todo o estoque da loja vive num arquivo só.** Se esse arquivo se perder, o
cadastro de todos os calçados vai junto. É o único problema deste sistema que
não tem conserto depois.

Para guardar uma cópia, dê dois cliques em
**`deploy/copia-de-seguranca.bat`**. Pode fazer isso com o sistema ligado.

As cópias ficam na pasta `backups`, e as 14 mais recentes são mantidas.

> **Faça isso pelo menos uma vez por semana.** Melhor ainda: copie a pasta
> `backups` para um pen drive de vez em quando. Uma cópia no mesmo computador
> não protege contra o computador quebrar.

### Para voltar uma cópia

1. Feche o sistema (feche a janela preta).
2. Na pasta `backups`, escolha o arquivo do dia que você quer.
3. Copie ele para a pasta do sistema.
4. Renomeie para `calcados_mariano.db`, trocando o que estava lá.
5. Ligue o sistema de novo.

> Voltar uma cópia apaga tudo que foi cadastrado **depois** dela. Guarde o
> arquivo atual antes, por segurança.

---

## Quando alguma coisa dá errado

| O que aconteceu                                        | O que fazer                                                                                 |
| :----------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| O site não abre                                        | Confira se a janela preta está aberta. Se não, dê dois cliques no `iniciar-sistema.bat`     |
| "Senha incorreta"                                      | A senha está errada. É a que foi escolhida na instalação                                    |
| "Este sistema ainda não foi configurado com uma senha" | A instalação não terminou. Rode `npm run instalar` de novo — não adianta tentar outra senha |
| A vitrine não mostra nenhum calçado                    | Nenhum produto cadastrado, ou o sistema está desligado                                      |
| Cadastrei e não apareceu                               | Recarregue a página. Se continuar, confira se a janela preta ainda está aberta              |
| O sistema pediu a senha do nada                        | A sessão de oito horas acabou. Entre de novo                                                |

---

## Para quem mantém o sistema

Esta parte é técnica. Quem só usa o sistema não precisa dela.

### Como está montado

Um servidor **Node.js com Express**, um banco **SQLite** (um arquivo), e as
telas em **React**. Em produção o mesmo processo entrega as duas telas e a API
na mesma porta: por isso a instalação cabe num comando e não há endereço de API
para configurar.

```
src/          o servidor: rotas, controllers, models
web/          as telas: web/src/vitrine e web/src/painel
db/           o esquema, os dados iniciais e a criação do banco
scripts/      instalar e copiar o banco
deploy/       os atalhos da máquina da loja
tests/        os testes do servidor
```

### Comandos

| Comando                 | O que faz                  |
| :---------------------- | :------------------------- |
| `npm run instalar`      | instala tudo, do zero      |
| `npm start`             | sobe o sistema             |
| `npm run backup`        | guarda uma cópia do banco  |
| `npm test`              | testes do servidor         |
| `npm test --prefix web` | testes das telas           |
| `npm run lint`          | confere o estilo do código |

### Em desenvolvimento

Aqui sim são dois terminais, de propósito — o Vite recarrega a tela a cada
alteração:

```bash
npm run dev              # servidor, na porta 3000
npm run dev --prefix web # telas, na porta 5173
```

Sem a pasta `web/dist`, o servidor sobe só como API e o Vite serve as telas com
proxy. É isso que faz o modo de desenvolvimento continuar valendo depois que o
servidor passou a entregar o site compilado.

### Configuração

O arquivo `.env` é criado pela instalação e **não** vai para o repositório. Ele
guarda a porta, o cálculo da senha do painel e a chave que assina as sessões.
Veja `.env.example` para a lista completa.

### Mais detalhes

- [Referência da API](docs/API.md)
- [O que ainda falta](docs/ROADMAP.md)

---

## Licença

Trabalho acadêmico. O uso do sistema pela Calçados Mariano é livre.
