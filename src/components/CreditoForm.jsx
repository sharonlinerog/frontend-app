import { useState } from "react";
import { registrarCredito } from "../api/creditosApi";
import { validarCredito } from "../utils/validation";

// Formatea con separadores de miles (es-CO: 5000000 -> "5.000.000") solo para
// MOSTRAR el valor del crédito; internamente se guarda el número "limpio" (solo
// dígitos). Esto evita el problema del <input type="number">, que se queda vacío
// cuando el usuario escribe puntos de miles.
const formatoMiles = new Intl.NumberFormat("es-CO");

const VALORES_INICIALES = {
  nombreCliente: "",
  cedula: "",
  valorCredito: "",
  tasaInteres: "",
  plazoMeses: "",
  comercial: "",
};

/**
 * Formulario de "Registro de Créditos" pedido en el requerimiento.
 * Estado del componente:
 *   - valores: lo que el usuario va escribiendo
 *   - errores: mensajes de validación por campo (se recalculan al enviar)
 *   - enviando: deshabilita el botón mientras la petición está en curso
 *   - mensaje: aviso de éxito/error que se muestra tras el envío
 */
export default function CreditoForm({ onCreditoRegistrado }) {
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  function actualizarCampo(campo, valor) {
    setValores((previo) => ({ ...previo, [campo]: valor }));
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setMensaje(null);

    const erroresValidacion = validarCredito(valores);
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) {
      return;
    }

    setEnviando(true);
    try {
      await registrarCredito({
        nombreCliente: valores.nombreCliente.trim(),
        cedula: valores.cedula.trim(),
        valorCredito: Number(valores.valorCredito),
        tasaInteres: Number(valores.tasaInteres),
        plazoMeses: Number(valores.plazoMeses),
        comercial: valores.comercial.trim(),
      });

      setMensaje({ tipo: "exito", texto: "Crédito registrado correctamente. Se notificará por correo automáticamente." });
      setValores(VALORES_INICIALES);
      setErrores({});
      onCreditoRegistrado?.();
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario-credito" onSubmit={manejarEnvio} noValidate>
      <div className="campo">
        <label htmlFor="nombreCliente">Nombre del cliente</label>
        <input
          id="nombreCliente"
          type="text"
          value={valores.nombreCliente}
          onChange={(e) => actualizarCampo("nombreCliente", e.target.value)}
        />
        {errores.nombreCliente && <span className="error-campo">{errores.nombreCliente}</span>}
      </div>

      <div className="campo">
        <label htmlFor="cedula">Cédula o ID</label>
        <input
          id="cedula"
          type="text"
          value={valores.cedula}
          onChange={(e) => actualizarCampo("cedula", e.target.value)}
        />
        {errores.cedula && <span className="error-campo">{errores.cedula}</span>}
      </div>

      <div className="campo">
        <label htmlFor="valorCredito">Valor del crédito</label>
        <input
          id="valorCredito"
          type="text"
          inputMode="numeric"
          placeholder="Ej: 5.000.000"
          value={valores.valorCredito === "" ? "" : formatoMiles.format(Number(valores.valorCredito))}
          onChange={(e) => actualizarCampo("valorCredito", e.target.value.replace(/\D/g, ""))}
        />
        {errores.valorCredito && <span className="error-campo">{errores.valorCredito}</span>}
      </div>

      <div className="campo">
        <label htmlFor="tasaInteres">Tasa de interés (%)</label>
        <input
          id="tasaInteres"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={valores.tasaInteres}
          onChange={(e) => actualizarCampo("tasaInteres", e.target.value)}
        />
        {errores.tasaInteres && <span className="error-campo">{errores.tasaInteres}</span>}
      </div>

      <div className="campo">
        <label htmlFor="plazoMeses">Plazo en meses</label>
        <input
          id="plazoMeses"
          type="number"
          min="1"
          step="1"
          value={valores.plazoMeses}
          onChange={(e) => actualizarCampo("plazoMeses", e.target.value)}
        />
        {errores.plazoMeses && <span className="error-campo">{errores.plazoMeses}</span>}
      </div>

      <div className="campo">
        <label htmlFor="comercial">Comercial que registra el crédito</label>
        <input
          id="comercial"
          type="text"
          value={valores.comercial}
          onChange={(e) => actualizarCampo("comercial", e.target.value)}
        />
        {errores.comercial && <span className="error-campo">{errores.comercial}</span>}
      </div>

      <button type="submit" disabled={enviando}>
        {enviando ? "Registrando..." : "Guardar crédito"}
      </button>

      {mensaje && <p className={`mensaje mensaje-${mensaje.tipo}`}>{mensaje.texto}</p>}
    </form>
  );
}
