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

// Los tres campos por los que se puede filtrar. En escritorio se muestran como
// tres cajas separadas (se pueden combinar); en móvil se muestra un solo
// buscador y estos chips deciden a cuál de los tres se aplica lo escrito.
const CAMPOS_BUSQUEDA = [
  { clave: "nombreCliente", etiqueta: "Cliente", placeholder: "Buscar por nombre" },
  { clave: "cedula", etiqueta: "Cédula", placeholder: "Buscar por documento" },
  { clave: "comercial", etiqueta: "Comercial", placeholder: "Buscar por comercial" },
];

const FILTROS_VACIOS = { nombreCliente: "", cedula: "", comercial: "" };

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
 * La misma información se pinta dos veces y el CSS decide cuál se ve:
 *   - escritorio: panel con los tres filtros + tabla
 *   - móvil: un buscador con selector de campo + lista de cards
 * El estado es uno solo (`filtros`), así que ambas vistas siempre coinciden.
 */
export default function CreditosTable({ refrescarSenal }) {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [campoBusqueda, setCampoBusqueda] = useState("nombreCliente");
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

  // Móvil: lo escrito en el buscador único se guarda en el campo elegido, y
  // los otros dos se limpian (solo se filtra por uno a la vez en esta vista).
  function actualizarBusqueda(valor) {
    setFiltros({ ...FILTROS_VACIOS, [campoBusqueda]: valor });
  }

  // Al cambiar de chip, el texto escrito se lleva al campo nuevo, para no
  // obligar a reescribirlo si el usuario solo se equivocó de columna.
  function cambiarCampoBusqueda(campo) {
    const textoActual = filtros[campoBusqueda];
    setCampoBusqueda(campo);
    setFiltros({ ...FILTROS_VACIOS, [campo]: textoActual });
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
    setFiltros(FILTROS_VACIOS);
    setSortBy("fecha");
    setSortDir("desc");
  }

  const campoActivo =
    CAMPOS_BUSQUEDA.find((c) => c.clave === campoBusqueda) ?? CAMPOS_BUSQUEDA[0];
  const textoBusqueda = filtros[campoBusqueda];
  const totalColocado = creditos.reduce(
    (suma, c) => suma + Number(c.valorCredito || 0),
    0,
  );
  const etiquetaDireccion =
    sortDir === "desc"
      ? sortBy === "fecha"
        ? "Más recientes"
        : "Mayor"
      : sortBy === "fecha"
        ? "Más antiguos"
        : "Menor";

  return (
    <>
      {/* Solo escritorio: título + total */}
      <div className="encabezado-seccion encabezado-consulta">
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
        {/* ---------- Controles móvil: un buscador + selector de campo ---------- */}
        <div className="controles-movil">
          <div className="buscador-movil">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input
              type="text"
              aria-label={`Buscar por ${campoActivo.etiqueta}`}
              placeholder={campoActivo.placeholder}
              value={textoBusqueda}
              onChange={(e) => actualizarBusqueda(e.target.value)}
            />
            {textoBusqueda !== "" && (
              <button
                type="button"
                className="limpiar-busqueda"
                aria-label="Limpiar búsqueda"
                onClick={() => actualizarBusqueda("")}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="chips-campo">
            {CAMPOS_BUSQUEDA.map((campo) => (
              <button
                key={campo.clave}
                type="button"
                className={`chip chip-oscuro ${campoBusqueda === campo.clave ? "activo" : ""}`}
                onClick={() => cambiarCampoBusqueda(campo.clave)}
              >
                {campo.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {/* Solo móvil: orden en una línea, con el total al lado */}
        <div className="barra-orden-movil">
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
          <button
            type="button"
            className="chip chip-direccion"
            onClick={() => setSortDir((previo) => (previo === "asc" ? "desc" : "asc"))}
          >
            <IconoDireccion ascendente={sortDir === "asc"} />
            {etiquetaDireccion}
          </button>
          {creditos.length > 0 && (
            <span className="total-movil">{formatoMoneda.format(totalColocado)}</span>
          )}
        </div>

        {/* ---------- Panel de filtros: solo escritorio ---------- */}
        <div className="panel-filtros">
          <div className="filtros">
            {CAMPOS_BUSQUEDA.map((campo) => (
              <div className="campo" key={campo.clave}>
                <label htmlFor={`filtro-${campo.clave}`}>
                  {campo.clave === "cedula" ? "Cédula / ID" : campo.etiqueta}
                </label>
                <input
                  id={`filtro-${campo.clave}`}
                  type="text"
                  placeholder={campo.placeholder}
                  value={filtros[campo.clave]}
                  onChange={(e) => actualizarFiltro(campo.clave, e.target.value)}
                />
              </div>
            ))}
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
              {etiquetaDireccion}
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
                  No hay créditos que coincidan con la búsqueda.
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
                      <strong>
                        {credito.plazoMeses} {credito.plazoMeses === 1 ? "mes" : "meses"}
                      </strong>
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
