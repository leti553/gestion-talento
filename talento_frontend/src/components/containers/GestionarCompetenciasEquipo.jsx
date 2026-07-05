import { useState, useEffect } from "react";


export default function GestionarCompetenciasEquipo({ empleadoId, alCerrar }) {
  const [perfil, setPerfil] = useState(null);
  const [mochila, setMochila] = useState([]);
  const token = localStorage.getItem("access");
  const API_URL = import.meta.env.VITE_API_URL;
  // CARGAR COMPETENCIAS DEL EMPLEADO CORRECTO
  useEffect(() => {
    async function cargar() {
      const res = await fetch(`${API_URL}/talento/api/empleado/${empleadoId}/competencias/`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setPerfil(data.empleado);
      setMochila(data.competencias);
    }

    cargar();
  }, [empleadoId, token]);

  const etiquetasOrigen = {
    "RPT": "Puesto (RPT)",
    "ESCO_OBL": "Obligatoria",
    "ESCO_OPC": "Opcional",
    "EXTRA": "Extra"
  };

  // GUARDAR CAMBIOS DEL JEFE
  const guardarEnServidor = async (competenciaId, campo, valor) => {
    try {
      const response = await fetch(
        `${API_URL}/talento/api/competencia/${competenciaId}/jefe/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ [campo]: valor }),
        }
      );

      if (response.ok) {
        const dataConfirmada = await response.json();
        console.log("Confirmado por el servidor:", dataConfirmada);

        setMochila(prev =>
          prev.map(c =>
            c.id === competenciaId ? { ...c, ...dataConfirmada } : c
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Error del servidor:", errorData);
        alert("El servidor rechazó el cambio: " + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  const actualizarEstadoLocal = (id, campo, valor) => {
    setMochila(prev =>
      prev.map(c =>
        c.id === id ? { ...c, [campo]: valor } : c
      )
    );
  };

  if (!perfil) return <p>Cargando competencias…</p>;

  return (
    <div className="page-container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>Evaluando a {perfil.nombre}</h1>
        <button onClick={alCerrar} className="btn-accion" style={{ background: "#ef4444", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none" }}>
          Finalizar
        </button>
      </div>

      <div className="competencias-grid">
        {mochila.map((c) => {
          const nivelJefe = Number(c.nivel_jefe ?? 0);
          const nivelEmp = Number(c.nivel_autoevaluacion ?? 0);

          return (
            <div key={c.id} className={`competencia-card nivel-${nivelJefe}`}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="competencia-nombre">
                  <span className={`icono-nivel n${nivelJefe}`}></span>
                  {c.habilidad?.nombre}
                </div>
                <span className={`origen-tag ${c.origen === "RPT" ? "origen-rpt" : c.origen === "ESCO_OBL" ? "origen-obligatoria" : "origen-opcional"}`}>
                  {etiquetasOrigen[c.origen] || c.origen}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "15px" }}>
                {/* AUTOEVALUACIÓN */}
                <div style={{ background: "#f1f5f9", padding: "10px", borderRadius: "8px" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: "bold", color: "#475569" }}>EMPLEADO</p>
                  <div className={`barra-nivel n${nivelEmp}`} style={{ margin: "10px 0" }}><div></div></div>
                  <p style={{ fontSize: "0.8rem" }}>Nivel: {nivelEmp}</p>
                  <p style={{ fontSize: "0.75rem", fontStyle: "italic" }}>"{c.observaciones_empleado || 'Sin comentarios'}"</p>
                </div>

                {/* EVALUACIÓN JEFE */}
                <div style={{ background: "#f0f7ff", padding: "10px", borderRadius: "8px", border: "1px solid #3b82f6" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: "bold", color: "#1d4ed8" }}>TU EVALUACIÓN</p>
                  
                  <select 
                    className="nivel-select"
                    style={{ width: "100%", marginTop: "10px" }}
                    value={nivelJefe}
                    onChange={(e) => {
                      const nuevoNivel = Number(e.target.value);
                      actualizarEstadoLocal(c.id, "nivel_jefe", nuevoNivel);
                      guardarEnServidor(c.id, "nivel_jefe", nuevoNivel);
                    }}
                  >
                    {[0,1,2,3,4,5].map(n => <option key={n} value={n}>Nivel {n}</option>)}
                  </select>

                  <textarea 
                    className="comentario-input"
                    style={{ width: "100%", marginTop: "10px", minHeight: "60px" }}
                    placeholder="Feedback del responsable..."
                    value={c.observaciones_jefe || ""}
                    onChange={(e) => actualizarEstadoLocal(c.id, "observaciones_jefe", e.target.value)}
                    onBlur={(e) => guardarEnServidor(c.id, "observaciones_jefe", e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
