import type { CapacitorConfig } from "@capacitor/cli";

// Configuración de Capacitor: es lo que le permite a esta misma app de React
// empaquetarse como una app Android nativa (y generar el .apk/.aab que pide
// el equipo). "webDir" apunta a la carpeta que genera "npm run build".
const config: CapacitorConfig = {
  appId: "com.russellbarranquilla.creditosapp",
  appName: "App Creditos",
  webDir: "dist",
};

export default config;
