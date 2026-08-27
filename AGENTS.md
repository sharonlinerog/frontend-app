# AGENTS.md — Guía para agentes de IA (Claude, Copilot, Cursor, etc.)

Este archivo sigue la convención [AGENTS.md](https://agents.md) para que cualquier asistente de IA que trabaje sobre este repositorio tenga contexto inmediato.

## Qué es este proyecto

Frontend en React de la app de créditos de **Fya Social Capital**: login, un formulario para registrar créditos y una pantalla para consultarlos (con filtros y orden). Consume la API REST del repo del backend (`CreditosApi`), que exige un JWT en cada llamada salvo en el login. Empaquetado con Capacitor para generar la app Android.

Stack: **React 19 + Vite + Capacitor**. Sin librería de manejo de estado externo (el estado vive en cada componente con `useState`, suficiente para el tamaño actual de la app).

## Comandos

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo (http://localhost:5173)
npm run build        # build de producción -> carpeta dist/
npm run lint         # linter (oxlint)
npx cap sync android # copiar el build web más reciente al proyecto Android
```

No hay pruebas automatizadas todavía. Si agregas alguna, usa Vitest + React Testing Library para componentes, y Playwright para flujos end-to-end (login -> formulario -> API -> consulta). Un flujo E2E debe probarse en **dos anchos** (1280px y 390px), porque la vista de consulta cambia de estructura según el ancho.

## Estructura y convenciones

- `src/api/httpClient.js` — **único** lugar que hace `fetch()` de verdad. Arma la URL base, adjunta `Authorization: Bearer {token}` si hay sesión, y centraliza el manejo de errores. Un 401 en cualquier endpoint que NO sea `/api/auth/login` se interpreta como "sesión vencida": limpia el token y avisa a `App.jsx` (vía `onNoAutorizado`) para que vuelva a mostrar el login. Un 401 en el login mismo es distinto — significa "usuario o contraseña incorrectos" y se muestra tal cual, sin tocar la sesión.
- `src/api/authToken.js` — dónde vive el token (`localStorage`) y el mini sistema de "avisos" (`onNoAutorizado`/`notificarNoAutorizado`) que usa `httpClient.js` para comunicarse con `App.jsx` sin acoplarse a React.
- `src/api/authApi.js` / `src/api/creditosApi.js` — funciones específicas de cada recurso, ambas construidas sobre `httpClient.js`. Cualquier endpoint nuevo se agrega como función exportada aquí, nunca con `fetch()` directo dentro de un componente.
- `src/utils/validation.js` — reglas de validación del formulario. Deben reflejar las de `CreditoCreateDto.cs` en el backend; en particular, `VALOR_CREDITO_MAXIMO` tiene que coincidir con el `[Range]` de ese DTO. Esto es solo la validación de "primera línea": el backend siempre vuelve a validar.
- `src/components/Login.jsx` — pantalla de login. Al validar, guarda el token con `setToken()` y llama a `onLoginExitoso`.
- `src/components/CreditoForm.jsx` — formulario controlado (un `useState` con todos los campos). Al enviar: valida localmente, si pasa llama a `registrarCredito()`, y notifica al padre (`onCreditoRegistrado`) para que la consulta se refresque.
- `src/components/CreditosTable.jsx` — la consulta completa: filtros, orden, tabla y cards. Pide la lista al backend cada vez que cambian los filtros, el orden, o la señal `refrescarSenal` que sube desde `App.jsx`. El filtrado y el orden ocurren en el servidor (query params), no en el navegador.
- `src/index.css` — variables de color y tipografía de la marca Fya. Es el único lugar donde se definen colores; los componentes usan `var(--...)`.
- `src/App.css` — todos los estilos, incluido el bloque `@media (max-width: 900px)` que define la vista móvil.
- `src/App.jsx` — decide si se muestra `Login` o el resto de la app (según si hay token guardado), se suscribe a `onNoAutorizado` para forzar logout si el backend rechaza el token, y conecta el formulario con la consulta vía el contador `refrescarSenal`.
- `public/logo-fya.png` — logo de la marca, usado en el login y en la barra superior.

## Cómo funciona el responsive

No hay componentes separados por dispositivo ni detección de user-agent: **el mismo componente pinta las dos vistas y el CSS oculta una**. El corte es 900px.

En `CreditosTable.jsx` conviven:

- `<table className="tabla-creditos">` y `<div className="lista-creditos">` — la misma lista de créditos, en tabla y en cards.
- `.panel-filtros` (tres campos combinables) y `.controles-movil` + `.barra-orden-movil` (buscador único con chips de campo).

El estado es **uno solo** (`filtros`, `sortBy`, `sortDir`), así que las dos vistas nunca se desincronizan. La vista móvil escribe en ese mismo objeto: `actualizarBusqueda` guarda lo escrito en el campo elegido por `campoBusqueda` y limpia los otros dos, porque en móvil se filtra por un campo a la vez.

Si agregas una vista nueva, sigue este patrón (duplicar el marcado, no el estado) antes que introducir un hook de tamaño de pantalla: evita parpadeos en la primera pintura y funciona igual al rotar el dispositivo.

En móvil la navegación también cambia de sitio: el mismo `<nav>` de `App.jsx` se reposiciona por CSS como barra fija al pie. No hay un segundo menú.

## Reglas al modificar código

1. Si agregas un campo al formulario, actualízalo en tres lugares: `CreditoForm.jsx` (input + estado inicial), `validation.js` (regla) y, del lado del backend, `CreditoCreateDto.cs` + `db/schema.sql` en el otro repo.
2. No pongas la URL del backend "hardcodeada" en ningún componente — siempre a través de `VITE_API_BASE_URL` (ver `src/api/httpClient.js`).
3. Cualquier llamada nueva a la API debe pasar por `httpClient.js` (directo o a través de un módulo como `creditosApi.js`), nunca con `fetch()` suelto — si no, no lleva el token ni el manejo de 401.
4. **Los colores van en `src/index.css` como variables.** No escribas hex nuevos dentro de un componente ni en reglas sueltas de `App.css`; si hace falta un tono que no existe, agrégalo como variable. Ojo con el contraste: `--verde` (`#6ECD89`) sirve para fondos, no para texto sobre blanco; para eso está `--verde-texto`.
5. Si tocas la vista de consulta, revisa **las dos** presentaciones (tabla y cards) y prueba a 1280px y a 390px. Es fácil arreglar una y romper la otra.
6. Los controles táctiles (chips, pestañas, botones) deben medir al menos 44px de alto en móvil. Ya hay reglas para eso en el bloque `@media`; si agregas un control nuevo, inclúyelo.
7. El campo del valor del crédito se maneja como **texto**, no como `<input type="number">`: guarda solo dígitos y muestra separadores de miles con `Intl.NumberFormat`. Un campo numérico se invalida y queda vacío cuando el usuario escribe los puntos de miles, lo que hacía que el formulario reportara "el valor debe ser mayor a 0" con un valor perfectamente válido en pantalla.
8. Después de cualquier cambio que afecte la app móvil, correr `npm run build && npx cap sync android` para que el proyecto Android quede actualizado.
9. Mantener `capacitor.config.ts` (appId, appName) sin cambios salvo que el equipo decida renombrar la app — cambiar el `appId` después de publicar en Play Store rompe las actualizaciones.
10. **Nunca copiar `dist/` sobre la raíz del proyecto.** El `index.html` compilado apunta a `/assets/...` y, si pisa al fuente, el siguiente build falla con `Failed to resolve /assets/...`. Ya pasó una vez y costó rato encontrarlo.
11. `typescript` está en `devDependencies` aunque el proyecto sea JavaScript: Capacitor lo necesita para leer `capacitor.config.ts`. No lo quites.

## Contexto de negocio (del requerimiento original)

- El formulario pide: nombre del cliente, cédula/ID, valor del crédito, tasa de interés, plazo en meses y el comercial que lo registra.
- Al registrar exitosamente, el backend se encarga de notificar por correo a `fyasocialcapital@gmail.com` — el frontend solo muestra la confirmación, no espera a que el correo salga.
- La consulta debe permitir filtrar por cliente, ID o comercial, y ordenar por fecha o valor.
- El registro y la consulta deben quedar protegidos (requisito de seguridad opcional del documento original: "uso de JWT o sesiones") — de ahí la pantalla de login.
