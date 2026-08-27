// Comunicación HTTP con los endpoints de créditos. La lógica común (armar la
// URL, adjuntar el token, manejar errores) vive en httpClient.js.
import { request } from "./httpClient";

/** Registra un nuevo crédito. Dispara POST /api/creditos (requiere sesión iniciada). */
export function registrarCredito(credito) {
  return request("/api/creditos", {
    method: "POST",
    body: JSON.stringify(credito),
  });
}

/**
 * Consulta créditos con filtros y orden opcionales (requiere sesión iniciada).
 * filtros = { nombreCliente, cedula, comercial, sortBy, sortDir }
 */
export function consultarCreditos(filtros = {}) {
  const params = new URLSearchParams(
    Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== "")
  );
  const query = params.toString();
  return request(`/api/creditos${query ? `?${query}` : ""}`);
}
