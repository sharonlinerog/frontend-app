// Cliente HTTP compartido por creditosApi.js y authApi.js: arma la URL,
// adjunta el token JWT (si hay sesión iniciada), y convierte cualquier
// respuesta de error en un Error de JS con mensaje legible.
import { getToken, clearToken, notificarNoAutorizado } from "./authToken";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5080";

export async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // El login es el único endpoint que puede responder 401 SIN que eso
  // signifique "tu sesión expiró": ahí un 401 es simplemente "usuario o
  // contraseña incorrectos", y se debe mostrar tal cual (más abajo, junto
  // con el resto de errores) en vez de forzar un cierre de sesión.
  const esLogin = path === "/api/auth/login";

  if (response.status === 401 && !esLogin) {
    // El token no existe, es inválido, o expiró: se limpia la sesión y se
    // avisa a la app (App.jsx) para que vuelva a mostrar el login.
    clearToken();
    notificarNoAutorizado();
    throw new Error("Tu sesión expiró o no has iniciado sesión. Vuelve a ingresar.");
  }

  if (!response.ok) {
    const errorBody = await safeParseJson(response);
    const mensaje =
      errorBody?.errors
        ? Object.values(errorBody.errors).flat().join(" | ")
        : errorBody?.error || `Error ${response.status} al comunicarse con el servidor`;
    throw new Error(mensaje);
  }

  if (response.status === 204) return null;
  return safeParseJson(response);
}

async function safeParseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
