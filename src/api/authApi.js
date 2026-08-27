// Comunicación HTTP para el login.
import { request } from "./httpClient";

/**
 * Intercambia usuario/contraseña por un token JWT.
 * Dispara POST /api/auth/login. Devuelve { token, expiraEn }.
 */
export function login(usuario, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ usuario, password }),
  });
}
