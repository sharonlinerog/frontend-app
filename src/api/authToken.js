// Manejo del token JWT en el navegador: dónde se guarda y cómo el resto de
// la app se entera cuando deja de ser válido (expiró, o el backend lo rechazó).
//
// Se usa localStorage (no solo memoria) a propósito: así, si el usuario
// recarga la página, no tiene que volver a hacer login cada vez.

const TOKEN_KEY = "creditos_app_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // localStorage puede fallar en navegadores con almacenamiento bloqueado
    // (modo incógnito estricto, políticas corporativas, etc.).
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Si no se puede guardar, la sesión simplemente no persiste entre
    // recargas; no es razón para romper el login.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ver comentario de arriba.
  }
}

// Mini sistema de "avisos" para que, cuando una petición a la API responda
// 401 (token vencido o inválido), cualquier parte de la app pueda reaccionar
// —en este proyecto, App.jsx lo usa para volver a mostrar el login— sin que
// httpClient.js tenga que conocer a los componentes de React.
let listenersNoAutorizado = [];

export function onNoAutorizado(callback) {
  listenersNoAutorizado.push(callback);
  return () => {
    listenersNoAutorizado = listenersNoAutorizado.filter((cb) => cb !== callback);
  };
}

export function notificarNoAutorizado() {
  listenersNoAutorizado.forEach((callback) => callback());
}
