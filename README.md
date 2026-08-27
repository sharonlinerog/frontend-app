# Fya Créditos (Frontend)

App en **React (Vite)** para registrar y consultar créditos, empaquetada con **Capacitor** para poder generar la app móvil Android (.apk/.aab). Consume la API del repo del backend (`CreditosApi`).

Una sola base de código sirve tres destinos: navegador de escritorio, navegador móvil y app Android instalable.

## Requisitos previos

- [Node.js 20+](https://nodejs.org/) y npm
- El backend (`CreditosApi`) corriendo — ver el repo del backend
- Para compilar el APK/AAB: [Android Studio](https://developer.android.com/studio) (incluye el SDK y el JDK), o un servidor Linux con el SDK de línea de comandos (ver la sección 5)

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar la URL del backend

```bash
cp .env.example .env
# Edita .env y ajusta VITE_API_BASE_URL
```

`VITE_API_BASE_URL` es la dirección donde responde el backend. Vite **incrusta este valor dentro del build**, así que hay que fijarlo antes de compilar y volver a compilar si cambia:

```
VITE_API_BASE_URL=http://localhost:5080                        # desarrollo local
VITE_API_BASE_URL=https://fyatest.eastus.cloudapp.azure.com    # servidor
```

> Para el APK, `localhost` no sirve: el celular es otro dispositivo. Ahí debe ir la URL pública (o la IP del PC en la red local). Y en Android la URL debe ser **https**, porque el sistema bloquea las conexiones sin cifrar por defecto.

## 3. Ejecutar en modo desarrollo (navegador)

```bash
npm run dev
```

Abre `http://localhost:5173`. Vas a ver primero la pantalla de login: usa el usuario y contraseña configurados en el backend (`Auth:Usuario` y la contraseña cuyo hash está en `Auth:PasswordHash`).

## 4. Compilar para producción (web)

```bash
npm run build
```

Genera la carpeta `dist/` lista para servir con cualquier servidor de archivos estáticos (Nginx, Netlify, Vercel, un bucket S3...).

> **Cuidado:** nunca copies el contenido de `dist/` sobre la raíz del proyecto. El `index.html` compilado apunta a `/assets/...`, y si reemplaza al `index.html` fuente (que apunta a `/src/main.jsx`), el siguiente `npm run build` falla con `Failed to resolve /assets/...`.

## 5. Generar el APK/AAB (Android)

El proyecto Android ya viene generado en la carpeta `android/` (vía Capacitor).

```bash
# 1. Compila la app web con la URL del backend correcta
npm run build

# 2. Copia esos archivos al proyecto Android
npx cap sync android

# 3a. Opción A: abrir en Android Studio y compilar desde ahí
npx cap open android
#    Luego: Build > Build Bundle(s) / APK(s) > Build APK(s)

# 3b. Opción B: compilar por línea de comandos
cd android
./gradlew assembleDebug      # genera un .apk de depuración
./gradlew bundleRelease      # genera un .aab (requiere firma para publicar)
```

El `.apk` de depuración queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

Requisitos del entorno de compilación (los tres son causa frecuente de fallo):

- **Node 22+** — `npx cap sync` lo exige y aborta con un mensaje claro si encuentra una versión menor.
- **JDK 21** — Capacitor 8 compila con `source release 21`; con JDK 17 falla con `invalid source release: 21`.
- **TypeScript instalado** — está en `devDependencies` porque Capacitor lo necesita para leer `capacitor.config.ts`. Si falta, `cap sync` no corre y el build de Gradle falla después por archivos que no se generaron.

En Linux, además, hay que apuntar el SDK y darle permiso de ejecución al wrapper:

```bash
export ANDROID_HOME=$HOME/android-sdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
echo "sdk.dir=$HOME/android-sdk" > android/local.properties
chmod +x android/gradlew
```

## 6. Compilar un AAB firmado para producción

Para publicar en Play Store hace falta generar un keystore y firmar el bundle — ver la guía oficial: https://developer.android.com/studio/publish/app-signing

## Autenticación

La app exige login antes de mostrar cualquier pantalla (`src/components/Login.jsx`). El token JWT que devuelve el backend se guarda en `localStorage` (para no perder la sesión al recargar) y se manda automáticamente en cada petición. Si el backend responde `401` en cualquier momento (token vencido o inválido), la app limpia la sesión y vuelve a pedir login sola.

## Diseño e identidad

La interfaz usa la identidad de **Fya Social Capital**: verde de marca `#6ECD89`, oscuro institucional `#102123` y tipografía **Montserrat**. Los colores viven como variables CSS en `src/index.css`; cambiar la marca es cambiar ese archivo, no los componentes.

Un detalle de contraste que conviene respetar: `#6ECD89` sobre blanco no alcanza contraste suficiente para texto, por eso los montos usan `--verde-texto` (`#2F7D51`). El verde de marca se reserva para fondos (botones, chips activos) y para texto sobre el oscuro.

El logo está en `public/logo-fya.png`. Es una versión extraída de una captura; si se dispone del original en PNG o SVG conviene reemplazarlo por ese, que tendrá mejor definición.

## Comportamiento responsive

El corte está en **900px** (`src/App.css`). No hay dos aplicaciones ni dos rutas: los mismos datos se pintan dos veces y el CSS decide cuál se muestra.

| | Escritorio (>900px) | Móvil (≤900px) |
|---|---|---|
| Navegación | Pestañas en la barra superior oscura | Barra fija al pie de la pantalla |
| Consulta | Tabla completa | Cards, una por crédito |
| Filtros | Tres campos combinables (cliente + cédula + comercial a la vez) | Un buscador y chips que eligen a cuál de los tres se aplica |
| Título de sección | Visible | Oculto (el espacio lo ocupa el buscador) |

La diferencia en los filtros es deliberada: en móvil los tres campos ocupaban media pantalla y empujaban los créditos fuera de la vista. El buscador único cabe en una línea, a cambio de filtrar por un solo campo a la vez. Si más adelante se necesita combinar filtros en móvil, el camino natural es una hoja deslizante, no volver a apilar los tres campos.

## Estructura del proyecto

```
src/
  api/httpClient.js           -> Cliente HTTP base: arma la URL, adjunta el token, maneja errores/401
  api/authApi.js              -> Login (POST /api/auth/login)
  api/authToken.js            -> Guardar/leer/limpiar el token (localStorage) + aviso de "no autorizado"
  api/creditosApi.js          -> Registro y consulta de créditos
  components/Login.jsx        -> Pantalla de login
  components/CreditoForm.jsx  -> Formulario de registro de créditos
  components/CreditosTable.jsx-> Consulta: filtros, orden, tabla (escritorio) y cards (móvil)
  utils/validation.js         -> Reglas de validación del formulario
  index.css                   -> Variables de color y tipografía de la marca
  App.css                     -> Todos los estilos, incluido el corte responsive
  App.jsx                     -> Componente raíz (decide login vs. app, pestañas)
public/logo-fya.png           -> Logo de Fya Social Capital
android/                      -> Proyecto nativo Android generado por Capacitor
```

Ver `AGENTS.md` para el detalle técnico de la arquitectura del frontend.
