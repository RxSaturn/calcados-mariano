@echo off
REM ===================================================================
REM  CALCADOS MARIANO - INICIAR O SISTEMA
REM ===================================================================
REM
REM  De dois cliques neste arquivo para ligar o sistema.
REM
REM  Para ele ligar sozinho quando o computador liga:
REM    1. Aperte a tecla Windows + R
REM    2. Digite:  shell:startup   e de Enter
REM    3. Copie este arquivo para a pasta que abrir
REM
REM  A janela preta que aparece E o sistema. Enquanto ela estiver aberta,
REM  o site funciona. Fechar a janela desliga o sistema.
REM ===================================================================

cd /d "%~dp0.."

if not exist "node_modules" (
  echo.
  echo  O sistema ainda nao foi instalado nesta maquina.
  echo  Abra o terminal nesta pasta e rode:  npm run instalar
  echo.
  pause
  exit /b 1
)

if not exist ".env" (
  echo.
  echo  Falta a configuracao. Rode:  npm run instalar
  echo.
  pause
  exit /b 1
)

echo.
echo  Ligando o sistema da Calcados Mariano...
echo.

REM O servidor sobe em segundo plano e a janela fica com ele. Fechar esta
REM janela desliga o sistema — e isso e proposital: nao existe jeito de
REM desligar por engano sem ver que desligou.
start "" http://localhost:3000
npm start
