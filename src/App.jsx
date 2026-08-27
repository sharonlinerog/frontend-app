import { useEffect, useState } from "react";
import CreditoForm from "./components/CreditoForm";
import CreditosTable from "./components/CreditosTable";
import Login from "./components/Login";
import { clearToken, getToken, onNoAutorizado } from "./api/authToken";
import "./App.css";

/**
 * Componente raíz. Además de decidir qué pestaña se ve (Registrar / Consultar),
 * controla si hay sesión iniciada: si no hay token guardado, muestra la
 * pantalla de login antes que cualquier otra cosa. También se suscribe a
 * "no autorizado" (ver api/authToken.js) para volver a pedir login solo si
 * el backend rechaza el token en algún momento (por ejemplo, expiró).
 */
export default function App() {
  const [autenticado, setAutenticado] = useState(() => Boolean(getToken()));
  const [pestanaActiva, setPestanaActiva] = useState("registrar");
  const [refrescarSenal, setRefrescarSenal] = useState(0);

  useEffect(() => {
    const desuscribir = onNoAutorizado(() => setAutenticado(false));
    return desuscribir;
  }, []);

  function cerrarSesion() {
    clearToken();
    setAutenticado(false);
  }

  if (!autenticado) {
    return <Login onLoginExitoso={() => setAutenticado(true)} />;
  }

  return (
    <div className="app-creditos">
      {/* En escritorio esta barra contiene la navegación; en móvil, el CSS
          mueve el <nav> al pie de la pantalla como barra de pestañas. */}
      <header className="barra-superior">
        <img src="/logo-fya.png" alt="Fya Social Capital" className="logo-fya" />

        <nav>
          <button
            className={pestanaActiva === "registrar" ? "activo" : ""}
            onClick={() => setPestanaActiva("registrar")}
          >
            Registrar crédito
          </button>
          <button
            className={pestanaActiva === "consultar" ? "activo" : ""}
            onClick={() => setPestanaActiva("consultar")}
          >
            Consultar créditos
          </button>
        </nav>

        <div className="usuario-sesion">
          <span className="avatar-usuario" aria-hidden="true">
            FY
          </span>
          <span className="nombre-usuario">comercial</span>
          <button className="boton-cerrar-sesion" onClick={cerrarSesion}>
            Salir
          </button>
        </div>
      </header>

      <main>
        {pestanaActiva === "registrar" ? (
          <CreditoForm onCreditoRegistrado={() => setRefrescarSenal((n) => n + 1)} />
        ) : (
          <CreditosTable refrescarSenal={refrescarSenal} />
        )}
      </main>
    </div>
  );
}
