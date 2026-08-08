import { useState } from 'react';

import { entrar } from '../../api/produtos';
import { LOJA } from '../../config';

/**
 * Entrada do painel de estoque.
 *
 * O servidor distingue duas situações que se parecem na tela e não são a mesma
 * coisa:
 *
 *   401  a senha está errada
 *   503  o servidor não tem senha nenhuma configurada
 *
 * Uma mensagem só para as duas faria o dono da loja tentar a senha de novo e de
 * novo, achando que errou de digitação, quando o problema está na instalação e
 * ele não tem como resolver dali. Por isso cada uma diz o que é, e a segunda
 * diz para quem ligar.
 */
function LoginForm({ aoEntrar }) {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await entrar(senha);
      setSenha('');
      aoEntrar();
    } catch (falha) {
      setErro({ status: falha.status, mensagem: falha.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <form className="login-caixa" onSubmit={enviar}>
        <h1 className="login-titulo">{LOJA.nome}</h1>
        <p className="login-subtitulo">Painel de estoque</p>

        <label className="login-rotulo" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          className="login-campo"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          autoFocus
          required
        />

        {erro && erro.status === 503 && (
          <p className="login-erro" role="alert">
            Este sistema ainda não foi configurado com uma senha. Quem instalou precisa rodar a
            instalação de novo para definir uma. Não adianta tentar outra senha aqui.
          </p>
        )}

        {erro && erro.status === 401 && (
          <p className="login-erro" role="alert">
            Senha incorreta.
          </p>
        )}

        {erro && erro.status !== 401 && erro.status !== 503 && (
          <p className="login-erro" role="alert">
            {erro.mensagem}
          </p>
        )}

        <button type="submit" className="login-botao" disabled={enviando || senha === ''}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="login-rodape">
          A vitrine da loja continua aberta em <a href="/">calçados mariano</a>. Só esta parte pede
          senha.
        </p>
      </form>
    </div>
  );
}

export default LoginForm;
