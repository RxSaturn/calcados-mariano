@echo off
REM ===================================================================
REM  CALCADOS MARIANO - COPIA DE SEGURANCA
REM ===================================================================
REM
REM  De dois cliques neste arquivo para guardar uma copia do estoque.
REM  Pode rodar com o sistema ligado: a copia sai certa mesmo assim.
REM
REM  As copias ficam na pasta "backups", e as 14 mais recentes sao
REM  mantidas. A mais antiga sai sozinha quando entra uma nova.
REM
REM  PARA RODAR SOZINHO TODO DIA:
REM    1. Abra o Agendador de Tarefas do Windows
REM    2. Criar Tarefa Basica -> Diariamente -> escolha um horario
REM    3. Acao: Iniciar um programa -> aponte para este arquivo
REM
REM  PARA RESTAURAR uma copia:
REM    1. Feche o sistema (feche a janela preta)
REM    2. Na pasta "backups", escolha o arquivo do dia que voce quer
REM    3. Copie ele para a pasta do sistema
REM    4. Renomeie para: calcados_mariano.db
REM       (troque o arquivo que ja estava la)
REM    5. Ligue o sistema de novo
REM
REM  ATENCAO: restaurar apaga tudo que foi cadastrado depois daquela
REM  copia. Guarde o arquivo atual antes, por seguranca.
REM ===================================================================

cd /d "%~dp0.."

echo.
echo  Guardando uma copia do estoque...
echo.

call npm run backup

echo.
pause
