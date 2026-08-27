import { useState } from "react";
import { login } from "../api/authApi";
import { setToken } from "../api/authToken";

/**
 * Pantalla de login. Al validar usuario/contraseña contra el backend
 * (POST /api/auth/login), guarda el token JWT devuelto y avisa al
 * componente padre (App.jsx) para que muestre el resto de la app.
 */
export default function Login({ onLoginExitoso }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError(null);

    if (!usuario.trim() || !password) {
      setError("Ingresa usuario y contraseña.");
      return;
    }

    setEnviando(true);
    try {
      const resultado = await login(usuario.trim(), password);
      setToken(resultado.token);
      onLoginExitoso();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pantalla-login">
      <form className="formulario-login" onSubmit={manejarEnvio} noValidate>
        <h1>App de Créditos</h1>
        <p className="subtitulo-login">Ingresa con el usuario del equipo comercial</p>

        <div className="campo">
          <label htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            type="text"
            autoFocus
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? "Ingresando..." : "Ingresar"}
        </button>

        {error && <p className="mensaje mensaje-error">{error}</p>}
      </form>
    </div>
  );
}
