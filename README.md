# App Créditos (Frontend)

App en **React (Vite)** para registrar y consultar créditos, empaquetada con **Capacitor** para poder generar la app móvil Android (.apk/.aab).

## Requisitos previos

- [Node.js 20+](https://nodejs.org/) y npm
- El backend (`CreditosApi`) corriendo — ver el repo del backend
- Para compilar el APK/AAB: [Android Studio](https://developer.android.com/studio) (incluye el SDK y JDK necesarios)

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar la URL del backend

```bash
cp .env.example .env
# Edita .env y ajusta VITE_API_BASE_URL si el backend no corre en localhost:5080
```

## 3. Ejecutar en modo desarrollo (navegador)

```bash
npm run dev
```

Abre `http://localhost:5173`. Vas a ver primero una pantalla de login: usa el usuario y contraseña configurados en el backend (`Auth:Usuario` / `Auth:Password` en `appsettings.json`).

## 4. Compilar para producción (web)

```bash
npm run build
```

Genera la carpeta `dist/` lista para desplegar en cualquier hosting estático (Netlify, Vercel, un bucket S3, etc.).

## 5. Generar el APK/AAB (Android)

El proyecto Android ya viene generado en la carpeta `android/` (vía Capacitor). Pasos para compilar:

```bash
# 1. Compila la app web más reciente
npm run build

# 2. Copia esos archivos al proyecto Android
npx cap sync android

# 3a. Opción A: abrir en Android Studio y compilar desde ahí
npx cap open android
#    Luego: Build > Build Bundle(s) / APK(s) > Build APK(s) (o Build Bundle para .aab)

# 3b. Opción B: compilar por línea de comandos (requiere Android SDK instalado)
cd android
./gradlew assembleDebug      # genera un .apk de depuración
./gradlew bundleRelease      # genera un .aab (requiere firma para publicar)
```

El `.apk` de depuración queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

## 6. Compilar un AAB firmado para producción

Para publicar en Play Store (o entregar un .aab firmado) hace falta generar un keystore y firmarlo — ver la guía oficial: https://developer.android.com/studio/publish/app-signing

## Autenticación

La app exige login antes de mostrar cualquier pantalla (ver `src/components/Login.jsx`). El token JWT que devuelve el backend se guarda en `localStorage` (para no perder la sesión al recargar la página) y se manda automáticamente en cada petición a la API. Si el backend responde `401` en cualquier momento (token vencido o inválido), la app limpia la sesión y vuelve a pedir login sola — no hace falta manejarlo a mano en cada pantalla.

## Estructura del proyecto

```
src/
  api/httpClient.js          -> Cliente HTTP base: arma la URL, adjunta el token, maneja errores/401
  api/authApi.js              -> Login (POST /api/auth/login)
  api/authToken.js            -> Guardar/leer/limpiar el token (localStorage) + aviso de "no autorizado"
  api/creditosApi.js          -> Registro y consulta de créditos
  components/Login.jsx        -> Pantalla de login
  components/CreditoForm.jsx  -> Formulario de registro de créditos
  components/CreditosTable.jsx -> Tabla de consulta con filtros y orden
  utils/validation.js         -> Reglas de validación del formulario
  App.jsx                     -> Componente raíz (decide login vs. app, pestañas Registrar/Consultar)
android/                     -> Proyecto nativo Android generado por Capacitor
```

Ver `AGENTS.md` para el detalle técnico de la arquitectura del frontend.
