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

  function limpiarFormulario() {
    setValores(VALORES_INICIALES);
    setErrores({});
    setMensaje(null);
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

      setMensaje({
        tipo: "exito",
        texto: "Crédito registrado correctamente. Se notificará por correo automáticamente.",
      });
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
    <>
      <div className="encabezado-seccion">
        <div>
          <h2>Registrar crédito</h2>
          <p>Al guardar se notifica automáticamente por correo al área de crédito.</p>
        </div>
      </div>

      <form className="formulario-credito" onSubmit={manejarEnvio} noValidate>
        {mensaje && (
          <p className={`mensaje mensaje-${mensaje.tipo}`}>{mensaje.texto}</p>
        )}

        <div className="tarjeta">
          <div className="tarjeta-titulo">Datos del crédito</div>

          <div className="campos-credito">
            <div className="campo campo-valor">
              <label htmlFor="valorCredito">Valor del crédito</label>
              <div className="campo-con-sufijo">
                <span className="prefijo-moneda">$</span>
                <input
                  id="valorCredito"
                  type="text"
                  inputMode="numeric"
                  placeholder="5.000.000"
                  value={
                    valores.valorCredito === ""
                      ? ""
                      : formatoMiles.format(Number(valores.valorCredito))
                  }
                  onChange={(e) =>
                    actualizarCampo("valorCredito", e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
              {errores.valorCredito ? (
                <span className="error-campo">{errores.valorCredito}</span>
              ) : (
                <span className="ayuda-campo">Máximo 1.000.000.000</span>
              )}
            </div>

            <div className="campo">
              <label htmlFor="nombreCliente">Nombre del cliente</label>
              <input
                id="nombreCliente"
                type="text"
                value={valores.nombreCliente}
                onChange={(e) => actualizarCampo("nombreCliente", e.target.value)}
              />
              {errores.nombreCliente && (
                <span className="error-campo">{errores.nombreCliente}</span>
              )}
            </div>

            <div className="fila-doble">
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
                <label htmlFor="comercial">Comercial que registra</label>
                <input
                  id="comercial"
                  type="text"
                  value={valores.comercial}
                  onChange={(e) => actualizarCampo("comercial", e.target.value)}
                />
                {errores.comercial && (
                  <span className="error-campo">{errores.comercial}</span>
                )}
              </div>
            </div>

            <div className="fila-doble">
              <div className="campo">
                <label htmlFor="tasaInteres">Tasa de interés</label>
                <div className="campo-con-sufijo">
                  <input
                    id="tasaInteres"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={valores.tasaInteres}
                    onChange={(e) => actualizarCampo("tasaInteres", e.target.value)}
                  />
                  <span>%</span>
                </div>
                {errores.tasaInteres && (
                  <span className="error-campo">{errores.tasaInteres}</span>
                )}
              </div>

              <div className="campo">
                <label htmlFor="plazoMeses">Plazo</label>
                <div className="campo-con-sufijo">
                  <input
                    id="plazoMeses"
                    type="number"
                    min="1"
                    step="1"
                    value={valores.plazoMeses}
                    onChange={(e) => actualizarCampo("plazoMeses", e.target.value)}
                  />
                  <span>meses</span>
                </div>
                {errores.plazoMeses && (
                  <span className="error-campo">{errores.plazoMeses}</span>
                )}
              </div>
            </div>
          </div>

          <div className="acciones-formulario">
            <button type="submit" className="boton-primario" disabled={enviando}>
              {enviando ? "Registrando..." : "Guardar crédito"}
            </button>
            <button
              type="button"
              className="boton-texto"
              onClick={limpiarFormulario}
              disabled={enviando}
            >
              Limpiar formulario
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
