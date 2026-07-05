import { useState } from "react";
import { Link } from "react-router-dom"; 
import useMediaQuery from "../../hooks/useMediaQuery"; 
import useBuscadorTalento from "../../hooks/useBuscadorTalento"; 
import "../../index.css"; 

export default function BuscadorTalentoBasico() {
  const { 
    unidades, 
    resultados, 
    cargando, 
    busquedaRealizada,
    sugerenciasHabilidades,
    setSugerenciasHabilidades,
    buscandoHabilidades,
    buscarSugerencias,
    buscarTalento 
  } = useBuscadorTalento();

  // Filtros finales que se enviarán
  const [filtroHabilidad, setFiltroHabilidad] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("1");
  const [filtroUnidad, setFiltroUnidad] = useState("");

  // Estados visuales del buscador de texto
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [nombreHabilidadSeleccionada, setNombreHabilidadSeleccionada] = useState("");

  const isMobile = useMediaQuery("(max-width: 768px)");

  // Se ejecuta cada vez que el usuario teclea algo
  const handleEscribirHabilidad = (e) => {
    const texto = e.target.value;
    setTextoBusqueda(texto);
    buscarSugerencias(texto);
  };

  // Se ejecuta al hacer clic en una sugerencia de la lista flotante
  const handleSeleccionarHabilidad = (habilidad) => {
    setFiltroHabilidad(habilidad.id);
    setNombreHabilidadSeleccionada(habilidad.nombre);
    // Limpiamos el texto y cerramos la lista
    setTextoBusqueda("");
    setSugerenciasHabilidades([]);
  };

  // Para borrar la habilidad elegida y volver a buscar
  const limpiarHabilidad = () => {
    setFiltroHabilidad("");
    setNombreHabilidadSeleccionada("");
  };

  const handleBuscar = () => {
    buscarTalento(filtroHabilidad, filtroNivel, filtroUnidad);
  };

  return (
    <div className="buscador-container">
      <h2 className="buscador-titulo">Buscador de Talento</h2>

      <div className="buscador-filtros">
        
        {/* BLOQUE DEL AUTOCOMPLETADO */}
        <div className="filtro-grupo">
          <label>Habilidad / Conocimiento</label>
          
          {filtroHabilidad ? (
            /* Mostrar bloque cuando ya hay una elegida */
            <div className="habilidad-seleccionada-badge">
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {nombreHabilidadSeleccionada}
              </span>
              <button className="btn-quitar-habilidad" onClick={limpiarHabilidad} title="Cambiar habilidad">
                &times;
              </button>
            </div>
          ) : (
            /* Mostrar input cuando no hay nada elegido */
            <div className="autocomplete-wrapper">
              <input
                type="text"
                className="autocomplete-input"
                placeholder="Ej. Python, Liderazgo, SQL..."
                value={textoBusqueda}
                onChange={handleEscribirHabilidad}
                autoComplete="off"
              />
              
              {buscandoHabilidades && (
                <span style={{ position: "absolute", right: "12px", top: "14px", fontSize: "0.8rem", color: "#94a3b8" }}>
                  Buscando...
                </span>
              )}

              {/* Lista desplegable de sugerencias */}
              {sugerenciasHabilidades.length > 0 && (
                <ul className="autocomplete-lista">
                  {sugerenciasHabilidades.map((h) => (
                    <li 
                      key={h.id} 
                      className="autocomplete-item"
                      onClick={() => handleSeleccionarHabilidad(h)}
                    >
                      {h.nombre}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="filtro-grupo" style={{ flex: isMobile ? "1 1 100%" : "0 1 150px" }}>
          <label>Nivel Mínimo</label>
          <select value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
            <option value="1">1 - Básico</option>
            <option value="2">2 - Intermedio</option>
            <option value="3">3 - Avanzado</option>
            <option value="4">4 - Experto</option>
          </select>
        </div>

        <div className="filtro-grupo">
          <label>Departamento</label>
          <select value={filtroUnidad} onChange={(e) => setFiltroUnidad(e.target.value)}>
            <option value="">-- Todo el Ayuntamiento --</option>
            {unidades.map(u => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>

        <button className="btn-buscar" onClick={handleBuscar} disabled={cargando}>
          {cargando ? "Buscando..." : "Buscar Talento"}
        </button>
      </div>

      {/* RENDERIZADO DE RESULTADOS  */}
      <div className="resultados-contenedor">
        {!busquedaRealizada ? (
          <div className="mensaje-estado">Utiliza los filtros superiores para encontrar perfiles.</div>
        ) : cargando ? (
          <div className="mensaje-estado">Analizando la base de talento...</div>
        ) : resultados.length === 0 ? (
          <div className="mensaje-estado">No se han encontrado empleados que cumplan estos criterios.</div>
        ) : isMobile ? (
          <div className="lista-tarjetas">
            {resultados.map((emp) => (
              <div key={emp.id} className="tarjeta-empleado">
                <div className="tarjeta-header">
                  <h3 className="nombre">
                    <Link to={`/equipo/${emp.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {emp.nombre_completo}
                    </Link>
                  </h3>
                  <p className="email">📧 {emp.email}</p>
                </div>
                <div className="tarjeta-body">
                  <div className="tarjeta-dato">
                    <span className="etiqueta">Puesto</span>
                    <span className="valor">{emp.puesto}</span>
                  </div>
                  <div className="tarjeta-dato">
                    <span className="etiqueta">Unidad</span>
                    <span className="valor">{emp.unidad}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="tabla-talento">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Puesto</th>
                <th>Unidad</th>
                <th>Contacto</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((emp) => (
                <tr key={emp.id}>
                  <td className="empleado-nombre">
                    <Link to={`/equipo/${emp.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {emp.nombre_completo}
                    </Link>
                  </td>
                  <td>{emp.puesto}</td>
                  <td className="empleado-meta">{emp.unidad}</td>
                  <td>{emp.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}