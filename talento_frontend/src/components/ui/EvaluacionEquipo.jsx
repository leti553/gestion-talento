import React, { useState } from "react";
import { useEvaluacionesJefe } from "../../hooks/useEvaluacionesJefe";

export default function EvaluacionEquipo() {
  const {
    empleados, totalElementos, cargando, error, busqueda, setBusqueda,
    orden, cambiarOrden, paginaActual, setPaginaActual, totalPaginas, refrescar,
    unidades, unidadId, setUnidadId, anio, setAnio
  } = useEvaluacionesJefe();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [datosForm, setDatosForm] = useState(null);
  const [notas, setNotas] = useState({});
  const [informeFinal, setInformeFinal] = useState("");
  
  const [descIndiv, setDescIndiv] = useState("");
  const [descColec, setDescColec] = useState("");
  const [puntosIndiv, setPuntosIndiv] = useState(0);
  const [puntosColec, setPuntosColec] = useState(0);
  const API_URL = import.meta.env.VITE_API_URL;
  const [guardando, setGuardando] = useState(false);
  
  const anioActual = new Date().getFullYear();
  const anioCampanaActiva = anioActual - 1;
  const esAnioActivo = anio === anioCampanaActiva; // Solo el año -1 es editable
  
  const estaCerrada = datosForm?.estado === "CERRADA";
  const esSoloLectura = estaCerrada || !datosForm?.puede_evaluar || !esAnioActivo;

  const abrirEvaluacion = async (empleadoId) => {
    try {
      // PASAMOS EL AÑO EN LA URL
      const res = await fetch(`${API_URL}/talento/api/jefe/evaluacion-empleado/${empleadoId}/?anio=${anio}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` }
      });
      if (!res.ok) throw new Error("Respuesta inválida del servidor");
      
      const data = await res.json();
      setDatosForm(data);
      setInformeFinal(data.informe_final || "");
      setDescIndiv(data.descripcion_indiv || "");
      setDescColec(data.descripcion_colec || "");
      
      setPuntosIndiv(parseFloat(data.puntos_individuales) || 0);
      setPuntosColec(parseFloat(data.puntos_colectivos) || 0);
      
      const notasIniciales = {};
      data.dimensiones.forEach(d => { notasIniciales[d.id] = Number(d.nota_actual) || 1; });
      setNotas(notasIniciales);
      setModalAbierto(true);
    } catch (err) {
      alert("Error cargando el formulario de evaluación. Revisa los logs del backend.");
    }
  };

  const handlePuntosIndivChange = (e) => {
    let valor = parseFloat(e.target.value);
    if (isNaN(valor)) valor = 0;
    if (valor > 5) valor = 5;
    if (valor < 0) valor = 0;
    setPuntosIndiv(valor);
  };

  const handlePuntosColecChange = (e) => {
    let valor = parseFloat(e.target.value);
    if (isNaN(valor)) valor = 0;
    if (valor > 15) valor = 15;
    if (valor < 0) valor = 0;
    setPuntosColec(valor);
  };

  const guardarEvaluacion = async (cerrarDefinitivamente = false) => {
    if (cerrarDefinitivamente && !window.confirm("¿Estás seguro de cerrar la evaluación? No podrá volver a editarse.")) return;
    setGuardando(true);
    try {
      const res = await fetch(`${API_URL}/talento/api/jefe/evaluacion-empleado/${datosForm.empleado_id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`
        },
        body: JSON.stringify({
          notas,
          informe_final: informeFinal,
          descripcion_indiv: descIndiv,
          descripcion_colec: descColec,
          puntos_individuales: puntosIndiv,
          puntos_colectivos: puntosColec,
          cerrar: cerrarDefinitivamente,
          anio: anio // ENVIAMOS EL AÑO EN EL BODY AL GUARDAR
        })
      });
      if (res.ok) {
        setModalAbierto(false);
        refrescar();
      } else {
        alert("El backend rechazó la actualización.");
      }
    } catch (err) {
      alert("Error guardando los datos.");
    } finally {
      setGuardando(false);
    }
  };

  let notaFinalCalculada = 0;
  let puntosTareaFinal = 0;
  let puntosConductualFinal = 0;
  let mediaTarea = 1;
  let mediaConductual = 1;
  let dimensionesOrdenadas = [];

  if (datosForm && datosForm.dimensiones) {
    const dimensionesTarea = datosForm.dimensiones.filter(d => d.bloque === 'TAREA');
    const dimensionesConductual = datosForm.dimensiones.filter(d => d.bloque !== 'TAREA'); 
    dimensionesOrdenadas = [...dimensionesTarea, ...dimensionesConductual];
    const notasTarea = dimensionesTarea.map(d => Number(notas[d.id]) || 1);
    const notasConductual = dimensionesConductual.map(d => Number(notas[d.id]) || 1);

    mediaTarea = notasTarea.length ? (notasTarea.reduce((a, b) => a + b, 0) / notasTarea.length) : 1;
    mediaConductual = notasConductual.length ? (notasConductual.reduce((a, b) => a + b, 0) / notasConductual.length) : 1;

    puntosTareaFinal = mediaTarea <= 1 ? 0 : Math.min(mediaTarea * 1.25, 5);
    puntosConductualFinal = mediaConductual <= 1 ? 0 : Math.min(mediaConductual * 1.25, 5);

    notaFinalCalculada = Number(puntosIndiv) + Number(puntosColec) + puntosTareaFinal + puntosConductualFinal;
  }

  // Usamos el año dinámico seleccionado en lugar de uno fijo
  const anioCampana = anio;

  if (cargando) return <div className="loader" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Cargando equipo de colaboradores...</div>;
  if (error) return <div style={{ color: "#ef4444", padding: "20px" }}>⚠️ Error: {error}</div>;
  
  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px", width: "100%" }}>
      
      <div className="perfil-header" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", padding: "24px", borderRadius: "12px", marginBottom: "24px", color: "#fff" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>🎯 Evaluación del Desempeño Técnico</h1>
        <p style={{ margin: "6px 0 0 0", opacity: 0.8, fontSize: "0.85rem" }}>Campaña Oficial de Calificación del Periodo (Año {anioCampana})</p>
      </div>

      <div className="card" style={{ padding: "16px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        
        {/* NUEVO SELECTOR DE AÑO */}
        <select
          value={anio}
          onChange={(e) => { setAnio(parseInt(e.target.value)); setPaginaActual(1); }}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", minWidth: "140px", fontSize: "0.85rem", background: "#f8fafc", cursor: "pointer", outline: "none" }}
        >
          {/* Solo mostramos hasta el año anterior (Campaña Activa) */}
          {[anioActual - 3, anioActual - 2, anioActual - 1].map(y => (
            <option key={y} value={y}>
              Campaña {y} {y === anioCampanaActiva ? "(Actual)" : "(Histórico)"}
            </option>
          ))}
        </select>

        {unidades && unidades.length > 0 && (
          <select
            value={unidadId || ""}
            onChange={(e) => { setUnidadId(e.target.value); setPaginaActual(1); }}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", minWidth: "220px", fontSize: "0.85rem", background: "#f8fafc", cursor: "pointer", outline: "none" }}
          >
            <option value="">🏢 Todos los departamentos</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        )}

        <input
          type="text"
          placeholder="🔍 Buscar por nombre o puesto..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", flex: "1 1 250px", fontSize: "0.85rem" }}
        />
        
        <div style={{ fontSize: "0.85rem", color: "#64748b", marginLeft: "auto" }}>
          Registros encontrados: <strong>{totalElementos}</strong>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem", minWidth: "600px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th onClick={() => cambiarOrden("nombre_completo")} style={{ padding: "14px 18px", cursor: "pointer", color: "#475569" }}>
                Empleado {orden.campo === "nombre_completo" ? (orden.direccion === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => cambiarOrden("puesto")} style={{ padding: "14px 18px", cursor: "pointer", color: "#475569" }}>
                Puesto Funcional {orden.campo === "puesto" ? (orden.direccion === "asc" ? "▲" : "▼") : ""}
              </th>
              <th style={{ padding: "14px 18px", color: "#475569" }}>Estado Campaña {anioCampana}</th>
              <th onClick={() => cambiarOrden("nota_total")} style={{ padding: "14px 18px", cursor: "pointer", color: "#475569", textAlign: "center" }}>
                Nota Final {orden.campo === "nota_total" ? (orden.direccion === "asc" ? "▲" : "▼") : ""}
              </th>
              <th style={{ padding: "14px 18px", color: "#475569", textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>No se encontraron colaboradores coincidentes.</td></tr>
            ) : (
              empleados.map((emp) => (
                <tr key={emp.id} className="table-row-hover" style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 18px", fontWeight: "600", color: "#1e293b" }}>{emp.nombre_completo}</td>
                  <td style={{ padding: "14px 18px", color: "#475569" }}>
                    <span style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", marginRight: "6px", fontWeight: "bold" }}>{emp.grupo}</span>
                    {emp.puesto}
                  </td>
                  {/* COLUMNA ESTADO */}
                  <td style={{ padding: "14px 18px" }}>
                    {emp.estado_evaluacion === "CERRADA" ? (
                      <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>🔒 Cerrada e Informada</span>
                    ) : emp.tiene_evaluacion ? (
                      <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>📝 Borrador en Curso</span>
                    ) : !esAnioActivo ? (
                      // NUEVO: Si es año histórico y no tiene evaluación
                      <span style={{ background: "#f1f5f9", color: "#64748b", padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>🚫 Sin evaluación</span>
                    ) : (
                      <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>⏳ Sin Iniciar</span>
                    )}
                  </td>

                  {/* COLUMNA NOTA */}
                  <td style={{ padding: "14px 18px", textAlign: "center", fontWeight: "bold", color: "#0f172a" }}>
                    {emp.tiene_evaluacion ? `${emp.nota_total} pts` : "-"}
                  </td>

                  {/* COLUMNA ACCIONES */}
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    {(!esAnioActivo && !emp.tiene_evaluacion) ? null : (
                      <button
                        onClick={() => abrirEvaluacion(emp.id)}
                        style={{
                          padding: "6px 12px", borderRadius: "6px", border: "none", fontSize: "0.8rem", cursor: "pointer", fontWeight: "600",
                          // AÑADIDO: Si es año histórico (!esAnioActivo), el botón se pinta de gris (solo lectura)
                          background: (emp.estado_evaluacion === "CERRADA" || !emp.puede_evaluar || !esAnioActivo) ? "#e2e8f0" : "#2563eb",
                          color: (emp.estado_evaluacion === "CERRADA" || !emp.puede_evaluar || !esAnioActivo) ? "#64748b" : "#fff"
                        }}
                      >
                        {emp.estado_evaluacion === "CERRADA" 
                          ? "👀 Consultar Acta" 
                          : !esAnioActivo 
                            ? "👀 Ver Evaluación" // Texto específico para años anteriores
                            : emp.puede_evaluar 
                              ? (emp.tiene_evaluacion ? "✏️ Modificar Notas" : "🚀 Evaluar Desempeño") 
                              : "👀 Ver Borrador"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px", alignItems: "center" }}>
          <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)} style={{ padding: "4px 10px", borderRadius: "4px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>Anterior</button>
          <span style={{ fontSize: "0.8rem", color: "#475569" }}>Página <strong>{paginaActual}</strong> de {totalPaginas}</span>
          <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(p => p + 1)} style={{ padding: "4px 10px", borderRadius: "4px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>Siguiente</button>
        </div>
      )}

      {modalAbierto && datosForm && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end", zIndex: 1000 }}>
          <div className="animate-fade-in" style={{ width: "100%", maxWidth: "700px", height: "100%", background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)", padding: "28px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            
            <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "20px" }}>
              <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#2563eb", fontWeight: "bold" }}>Formulario de Calificación Oficial</span>
              <h2 style={{ margin: "4px 0 0 0", fontSize: "1.2rem", color: "#0f172a" }}>{datosForm.empleado}</h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>{datosForm.puesto}</p>
              {esSoloLectura && (
                <div style={{ marginTop: "10px", padding: "8px", background: "#fef2f2", color: "#dc2626", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", border: "1px solid #fecaca" }}>
                  🔒 Modo Lectura: Formulario no editable (Año cerrado, acta definitiva o no eres el evaluador directo).
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "0.9rem", color: "#475569", borderBottom: "2px solid #f1f5f9", paddingBottom: "6px" }}>Sección I y II: Dimensiones de Trabajo (Factores)</h3>
              {dimensionesOrdenadas.map((dim) => (
                <div key={dim.id} style={{ marginBottom: "18px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <label style={{ fontWeight: "600", fontSize: "0.85rem", color: "#1e293b" }}>
                      {dim.nombre} {dim.es_obligatoria && <span style={{ color: "#ef4444" }}>*</span>}
                    </label>
                    <span style={{ fontSize: "0.65rem", background: dim.bloque === "TAREA" ? "#e0f2fe" : "#fef3c7", color: dim.bloque === "TAREA" ? "#0369a1" : "#b45309", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>{dim.bloque}</span>
                  </div>
                  <p style={{ margin: "0 0 10px 0", fontSize: "0.75rem", color: "#64748b" }}>{dim.descripcion}</p>
                  
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        type="button"
                        disabled={esSoloLectura}
                        onClick={() => setNotas(prev => ({ ...prev, [dim.id]: Number(n) }))}
                        style={{
                          flex: 1, minWidth: "80px", padding: "8px", borderRadius: "6px", fontSize: "0.75rem", cursor: esSoloLectura ? "not-allowed" : "pointer", border: "1px solid", fontWeight: "600", transition: "all 0.2s",
                          borderColor: notas[dim.id] === n ? "#2563eb" : "#cbd5e1",
                          background: notas[dim.id] === n ? "#2563eb" : "#fff",
                          color: notas[dim.id] === n ? "#fff" : "#475569",
                          opacity: esSoloLectura ? 0.7 : 1
                        }}
                      >
                        {n === 1 ? "1. Muy Insuf." : n === 2 ? "2. Insuf." : n === 3 ? "3. Bueno" : "4. Excelente"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <h3 style={{ fontSize: "0.9rem", color: "#475569", borderBottom: "2px solid #f1f5f9", paddingBottom: "6px", marginTop: "24px", marginBottom: "16px" }}>Metas y Objetivos Anuales (Rendimiento)</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#1e293b" }}>Objetivos Individuales</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Puntos (Máx. 5):</span>
                      <input 
                        type="number" step="0.1" min="0" max="5"
                        disabled={esSoloLectura} 
                        value={puntosIndiv} onChange={handlePuntosIndivChange} 
                        style={{ width: "80px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "bold", color: "#0f172a" }} 
                      />
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    disabled={esSoloLectura}
                    value={descIndiv}
                    onChange={(e) => setDescIndiv(e.target.value)}
                    placeholder="Memoria justificativa de los objetivos individuales alcanzados..."
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontFamily: "inherit", resize: "vertical" }}
                  />
                </div>

                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#1e293b" }}>Objetivos Colectivos</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Puntos (Máx. 15):</span>
                      <input 
                        type="number" step="0.1" min="0" max="15"
                        disabled={esSoloLectura} 
                        value={puntosColec} onChange={handlePuntosColecChange} 
                        style={{ width: "80px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "bold", color: "#0f172a" }} 
                      />
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    disabled={esSoloLectura}
                    value={descColec}
                    onChange={(e) => setDescColec(e.target.value)}
                    placeholder="Memoria justificativa de los objetivos del departamento/área..."
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontFamily: "inherit", resize: "vertical" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", color: "#1e293b" }}>Informe Justificativo y Conclusiones Finales</label>
                <textarea
                  rows={4}
                  disabled={esSoloLectura}
                  value={informeFinal}
                  onChange={(e) => setInformeFinal(e.target.value)}
                  placeholder="Escribe aquí las conclusiones globales del evaluador..."
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#1e293b", fontSize: "0.9rem", display: "flex", justifyContent: "space-between" }}>
                  Resumen Puntuación (Decreto 49/2022) <span>Total: 30 pts</span>
                </h4>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem", color: "#475569" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Bloque Rendimiento (Objetivos):</span>
                    <strong>{(Number(puntosIndiv) + Number(puntosColec)).toFixed(2)} pts</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Factor Tarea (Media: {mediaTarea.toFixed(2)} x 1.25):</span>
                    <strong>{puntosTareaFinal.toFixed(2)} pts</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Factor Conductual (Media: {mediaConductual.toFixed(2)} x 1.25):</span>
                    <strong>{puntosConductualFinal.toFixed(2)} pts</strong>
                  </div>
                </div>

                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "2px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "bold", color: "#0f172a", fontSize: "0.9rem" }}>NOTA DE EVALUACIÓN GLOBAL</span>
                  <span style={{ fontWeight: "900", color: "#2563eb", fontSize: "1.2rem" }}>{notaFinalCalculada.toFixed(2)}</span>
                </div>
              </div>

            </div>

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button onClick={() => setModalAbierto(false)} style={{ padding: "10px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", fontSize: "0.85rem", cursor: "pointer", fontWeight: "600", color: "#475569" }}>
                {esSoloLectura ? "Cerrar Panel" : "Cancelar"}
              </button>
              
              {!esSoloLectura && (
                <>
                  <button disabled={guardando} onClick={() => guardarEvaluacion(false)} style={{ padding: "10px 16px", borderRadius: "6px", border: "none", background: "#475569", color: "#fff", fontSize: "0.85rem", cursor: "pointer", fontWeight: "600" }}>💾 Guardar Borrador</button>
                  <button disabled={guardando} onClick={() => guardarEvaluacion(true)} style={{ padding: "10px 16px", borderRadius: "6px", border: "none", background: "#16a34a", color: "#fff", fontSize: "0.85rem", cursor: "pointer", fontWeight: "bold" }}>🔒 Cerrar Acta Definitiva</button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}