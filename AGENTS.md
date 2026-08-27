# AGENTS.md — Guía para agentes de IA (Claude, Copilot, Cursor, etc.)

Este archivo sigue la convención [AGENTS.md](https://agents.md) para que cualquier asistente de IA que trabaje sobre este repositorio tenga contexto inmediato.

## Qué es este proyecto

Frontend en React de la app de créditos: login, un formulario para registrar créditos y una tabla para consultarlos (con filtros y orden). Consume la API REST del repo del backend (`CreditosApi`), que exige un JWT en cada llamada salvo en el login. Empaquetado con Capacitor para generar la app Android.

Stack: **React 19 + Vite + Capacitor**. Sin librería de manejo de estado externo (el estado vive en cada componente con `useState`, suficiente para el tamaño actual de la app).

## Comandos

```bash
npm install       # instalar dependencias
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build       # build de producción -> carpeta dist/
npm run lint        # linter (oxlint)
npx cap sync android # copiar el build web más reciente al proyecto Android
```

No hay pruebas automatizadas todavía. Si agregas alguna, usa Vitest + React Testing Library para componentes, y Playwright para flujos end-to-end (formulario -> API -> tabla).

## Estructura y convenciones

- `src/api/httpClient.js` — **único** lugar que hace `fetch()` de verdad. Arma la URL base, adjunta `Authorization: Bearer {token}` si hay sesión, y centraliza el manejo de errores. Un 401 en cualquier endpoint que NO sea `/api/auth/login` se interpreta como "sesión vencida": limpia el token y avisa a `App.jsx` (vía `onNoAutorizado`) para que vuelva a mostrar el login. Un 401 en el login mismo es distinto — significa "usuario o contraseña incorrectos" y se muestra tal cual, sin tocar la sesión (no hay sesión todavía).
- `src/api/authToken.js` — dónde vive el token (`localStorage`) y el mini sistema de "avisos" (`onNoAutorizado`/`notificarNoAutorizado`) que usa `httpClient.js` para comunicarse con `App.jsx` sin acoplarse a React.
- `src/api/authApi.js` / `src/api/creditosApi.js` — funciones específicas de cada recurso, ambas construidas sobre `httpClient.js`. Cualquier endpoint nuevo se agrega como función exportada aquí, nunca con `fetch()` directo dentro de un componente.
- `src/utils/validation.js` — reglas de validación del formulario. Deben reflejar (no necesariamente duplicar línea por línea, pero sí en espíritu) las reglas de `CreditoCreateDto.cs` en el backend. Esto es solo la validación de "primera línea": el backend siempre vuelve a validar.
- `src/components/Login.jsx` — pantalla de login. Al validar, guarda el token con `setToken()` y llama a `onLoginExitoso` (prop que le pasa `App.jsx`).
- `src/components/CreditoForm.jsx` — formulario controlado (un `useState` con todos los campos). Al enviar: valida localmente, si pasa llama a `registrarCredito()`, y notifica al padre (`onCreditoRegistrado`) para que la tabla se refresque.
- `src/components/CreditosTable.jsx` — pide la lista al backend cada vez que cambian los filtros, el orden, o la señal `refrescarSenal` que sube desde `App.jsx`. El filtrado/orden ocurre en el servidor (query params), no en el navegador.
- `src/App.jsx` — decide si se muestra `Login` o el resto de la app (según si hay token guardado), se suscribe a `onNoAutorizado` para forzar logout si el backend rechaza el token en cualquier momento, y conecta el formulario con la tabla vía el contador `refrescarSenal`.

## Reglas al modificar código

1. Si agregas un campo al formulario, actualízalo en tres lugares: `CreditoForm.jsx` (input + estado inicial), `validation.js` (regla) y, del lado del backend, `CreditoCreateDto.cs` + `db/schema.sql` en el otro repo.
2. No pongas la URL del backend "hardcodeada" en ningún componente — siempre a través de `VITE_API_BASE_URL` (ver `src/api/httpClient.js`).
3. Cualquier llamada nueva a la API debe pasar por `httpClient.js` (directo o a través de un módulo como `creditosApi.js`), nunca con `fetch()` suelto — si no, no lleva el token ni el manejo de 401.
4. Después de cualquier cambio visual o de build, si afecta la app móvil, correr `npm run build && npx cap sync android` para que el proyecto Android quede con los cambios.
5. Mantener `capacitor.config.ts` (appId, appName) sin cambios salvo que el equipo decida renombrar la app — cambiar el `appId` después de publicar en Play Store rompe las actualizaciones.

## Contexto de negocio (del requerimiento original)

- El formulario pide: nombre del cliente, cédula/ID, valor del crédito, tasa de interés, plazo en meses y el comercial que lo registra.
- Al registrar exitosamente, el backend se encarga de notificar por correo — el frontend solo necesita mostrar la confirmación, no espera a que el correo se envíe.
- La consulta debe permitir filtrar por cliente, ID o comercial, y ordenar por fecha o valor.
- El registro y la consulta deben quedar protegidos (requisito de seguridad opcional del documento original: "uso de JWT o sesiones") — de ahí la pantalla de login.
