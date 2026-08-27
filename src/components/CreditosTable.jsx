import { useEffect, useState, useCallback } from "react";
import { consultarCreditos } from "../api/creditosApi";

const formatoMoneda = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "short",
  timeStyle: "short",
});

// Flecha de dirección del orden. Se dibuja en SVG (no con un carácter) para
// que mantenga el mismo grosor y tamaño en cualquier plataforma.
function IconoDireccion({ ascendente }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: ascendente ? "rotate(180deg)" : "none" }}
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

/**
 * Módulo de "Consulta de Créditos": filtros (cliente, ID, comercial) + orden
 * (por fecha o por valor). Cada vez que cambia un filtro o el orden se vuelve
 * a pedir la lista al backend (el filtrado/orden real ocurre en la base de
 * datos, no en el navegador, para que escale con muchos registros).
 *
 * Los mismos datos se pintan de dos formas y el CSS decide cuál se ve:
 * una tabla en escritorio y una lista de cards en móvil (ver App.css).
 */
export default function CreditosTable({ refrescarSenal }) {
  const [filtros, setFiltros] = useState({ nombreCliente: "", cedula: "", comercial: "" });
  const [sortBy, setSortBy] = useState("fecha");
  const [sortDir, setSortDir] = useState("desc");
  const [creditos, setCreditos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargarCreditos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await consultarCreditos({ ...filtros, sortBy, sortDir });
      setCreditos(resultado ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [filtros, sortBy, sortDir]);

  // Se vuelve a consultar cuando cambian filtros/orden, y también cada vez
  // que se registra un crédito nuevo desde el formulario (ver App.jsx).
  useEffect(() => {
    cargarCreditos();
  }, [cargarCreditos, refrescarSenal]);

  function actualizarFiltro(campo, valor) {
    setFiltros((previo) => ({ ...previo, [campo]: valor }));
  }

  function cambiarOrden(campo) {
    if (sortBy === campo) {
      setSortDir((previo) => (previo === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(campo);
      setSortDir("desc");
    }
  }

  // ¿Hay algún filtro escrito o el orden cambió respecto al inicial?
  const hayFiltrosActivos =
    filtros.nombreCliente !== "" ||
    filtros.cedula !== "" ||
    filtros.comercial !== "" ||
    sortBy !== "fecha" ||
    sortDir !== "desc";

  function limpiarFiltros() {
    setFiltros({ nombreCliente: "", cedula: "", comercial: "" });
    setSortBy("fecha");
    setSortDir("desc");
  }

  const totalColocado = creditos.reduce((suma, c) => suma + Number(c.valorCredito || 0), 0);

  return (
    <>
      <div className="encabezado-seccion">
        <div>
          <h2>Consultar créditos</h2>
          <p>
            {creditos.length === 1
              ? "1 crédito encontrado"
              : `${creditos.length} créditos encontrados`}
          </p>
        </div>
        {creditos.length > 0 && (
          <div className="total-colocado">
            <span>Total colocado</span>
            <strong>{formatoMoneda.format(totalColocado)}</strong>
          </div>
        )}
      </div>

      <div className="consulta-creditos">
        <div className="panel-filtros">
          <div className="filtros">
            <div className="campo">
              <label htmlFor="filtro-cliente">Cliente</label>
              <input
                id="filtro-cliente"
                type="text"
                placeholder="Buscar por nombre"
                value={filtros.nombreCliente}
                onChange={(e) => actualizarFiltro("nombreCliente", e.target.value)}
              />
            </div>
            <div className="campo">
              <label htmlFor="filtro-cedula">Cédula / ID</label>
              <input
                id="filtro-cedula"
                type="text"
                placeholder="Buscar por documento"
                value={filtros.cedula}
                onChange={(e) => actualizarFiltro("cedula", e.target.value)}
              />
            </div>
            <div className="campo">
              <label htmlFor="filtro-comercial">Comercial</label>
              <input
                id="filtro-comercial"
                type="text"
                placeholder="Buscar por comercial"
                value={filtros.comercial}
                onChange={(e) => actualizarFiltro("comercial", e.target.value)}
              />
            </div>
          </div>

          <div className="orden-controles">
            <span className="etiqueta-orden">Ordenar por</span>
            <div className="chips-orden">
              <button
                type="button"
                className={`chip ${sortBy === "fecha" ? "activo" : ""}`}
                onClick={() => setSortBy("fecha")}
              >
                Fecha
              </button>
              <button
                type="button"
                className={`chip ${sortBy === "valor" ? "activo" : ""}`}
                onClick={() => setSortBy("valor")}
              >
                Valor
              </button>
            </div>

            <button
              type="button"
              className="chip chip-direccion"
              onClick={() => setSortDir((previo) => (previo === "asc" ? "desc" : "asc"))}
            >
              <IconoDireccion ascendente={sortDir === "asc"} />
              {sortDir === "desc"
                ? sortBy === "fecha"
                  ? "Más recientes"
                  : "Mayor valor"
                : sortBy === "fecha"
                  ? "Más antiguos"
                  : "Menor valor"}
            </button>

            <button
              type="button"
              className="boton-texto boton-limpiar"
              onClick={limpiarFiltros}
              disabled={!hayFiltrosActivos}
            >
              Quitar filtros
            </button>
          </div>
        </div>

        {error && <p className="mensaje mensaje-error">{error}</p>}
        {cargando && <p className="estado-consulta">Cargando créditos...</p>}

        {!cargando && !error && (
          <>
            {/* Escritorio */}
            <table className="tabla-creditos">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Cédula / ID</th>
                  <th onClick={() => cambiarOrden("valor")} className="ordenable celda-num">
                    Valor {sortBy === "valor" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="celda-num">Tasa</th>
                  <th className="celda-num">Plazo</th>
                  <th>Comercial</th>
                  <th onClick={() => cambiarOrden("fecha")} className="ordenable celda-num">
                    Fecha {sortBy === "fecha" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {creditos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="celda-vacia">
                      No hay créditos registrados que coincidan con el filtro.
                    </td>
                  </tr>
                )}
                {creditos.map((credito) => (
                  <tr key={credito.id}>
                    <td className="celda-cliente">{credito.nombreCliente}</td>
                    <td className="celda-num" style={{ textAlign: "left" }}>
                      {credito.cedula}
                    </td>
                    <td className="celda-valor">
                      {formatoMoneda.format(credito.valorCredito)}
                    </td>
                    <td className="celda-num">{credito.tasaInteres}%</td>
                    <td className="celda-num">{credito.plazoMeses} m</td>
                    <td>{credito.comercial}</td>
                    <td className="celda-num">
                      {formatoFecha.format(new Date(credito.fechaRegistro))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Móvil */}
            <div className="lista-creditos">
              {creditos.length === 0 && (
                <p className="estado-consulta">
                  No hay créditos registrados que coincidan con el filtro.
                </p>
              )}
              {creditos.map((credito) => (
                <article className="card-credito" key={credito.id}>
                  <div className="card-credito-cabecera">
                    <div className="card-credito-cliente">
                      <strong>{credito.nombreCliente}</strong>
                      <span>{credito.cedula}</span>
                    </div>
                    <span className="card-credito-valor">
                      {formatoMoneda.format(credito.valorCredito)}
                    </span>
                  </div>
                  <div className="card-credito-detalle">
                    <div className="card-credito-dato">
                      <span>Tasa</span>
                      <strong>{credito.tasaInteres}%</strong>
                    </div>
                    <div className="card-credito-dato">
                      <span>Plazo</span>
                      <strong>{credito.plazoMeses} meses</strong>
                    </div>
                    <div className="card-credito-dato">
                      <span>Registrado</span>
                      <strong>{formatoFecha.format(new Date(credito.fechaRegistro))}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
