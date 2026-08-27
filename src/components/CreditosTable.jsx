import { useEffect, useState, useCallback } from "react";
import { consultarCreditos } from "../api/creditosApi";

const formatoMoneda = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" });

/**
 * Módulo de "Consulta de Créditos": tabla + filtros (cliente, ID, comercial)
 * + orden (por fecha o por valor). Cada vez que cambia un filtro o el orden,
 * se vuelve a pedir la lista al backend (el filtrado/orden real ocurre en la
 * base de datos, no en el navegador, para que escale con muchos registros).
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

  return (
    <div className="consulta-creditos">
      <div className="filtros">
        <input
          type="text"
          placeholder="Filtrar por cliente"
          value={filtros.nombreCliente}
          onChange={(e) => actualizarFiltro("nombreCliente", e.target.value)}
        />
        <input
          type="text"
          placeholder="Filtrar por cédula/ID"
          value={filtros.cedula}
          onChange={(e) => actualizarFiltro("cedula", e.target.value)}
        />
        <input
          type="text"
          placeholder="Filtrar por comercial"
          value={filtros.comercial}
          onChange={(e) => actualizarFiltro("comercial", e.target.value)}
        />
      </div>

      <div className="orden-controles">
        <label>
          Ordenar por:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="fecha">Fecha</option>
            <option value="valor">Valor</option>
          </select>
        </label>
        <label>
          Dirección:
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
            <option value="desc">Descendente (mayor a menor)</option>
            <option value="asc">Ascendente (menor a mayor)</option>
          </select>
        </label>
        <button
          type="button"
          className="boton-limpiar"
          onClick={limpiarFiltros}
          disabled={!hayFiltrosActivos}
        >
          Quitar filtros
        </button>
      </div>

      {error && <p className="mensaje mensaje-error">{error}</p>}
      {cargando && <p>Cargando créditos...</p>}

      {!cargando && !error && (
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Cédula/ID</th>
              <th onClick={() => cambiarOrden("valor")} className="ordenable">
                Valor {sortBy === "valor" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Tasa</th>
              <th>Plazo</th>
              <th>Comercial</th>
              <th onClick={() => cambiarOrden("fecha")} className="ordenable">
                Fecha {sortBy === "fecha" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {creditos.length === 0 && (
              <tr>
                <td colSpan={7}>No hay créditos registrados que coincidan con el filtro.</td>
              </tr>
            )}
            {creditos.map((credito) => (
              <tr key={credito.id}>
                <td>{credito.nombreCliente}</td>
                <td>{credito.cedula}</td>
                <td>{formatoMoneda.format(credito.valorCredito)}</td>
                <td>{credito.tasaInteres}%</td>
                <td>{credito.plazoMeses} meses</td>
                <td>{credito.comercial}</td>
                <td>{formatoFecha.format(new Date(credito.fechaRegistro))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
