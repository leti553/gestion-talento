import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from "recharts";
import useGraficosJefe from "../../hooks/useGraficosJefe";


export default function GraficosJefe() {
  const { datos, cargando, error } = useGraficosJefe();

  if (cargando) {
    return (
      <div className="grrhh-loading-screen" style={{ color: "#2563eb", fontWeight: "bold" }}>
        <div className="loader">Cargando métricas de tu equipo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grrhh-error-screen">
        ❌ No se pudieron cargar los datos del equipo.
      </div>
    );
  }

  if (!datos) return null;

  // --- CÁLCULOS DE TALENTO ---
  const porcentajeCumplimiento = datos.nivel_posible_vs_real?.posible 
    ? ((datos.nivel_posible_vs_real.real / datos.nivel_posible_vs_real.posible) * 100).toFixed(1)
    : 0;
  
  const masFormado = datos.empleados_mas_titulaciones?.[0]?.empleado__nombre || "N/D";
  const alertaCompetencia = datos.top5_bajo_nivel?.[0]?.empleado__nombre || "Ninguno";

  // --- CÁLCULOS DE DESEMPEÑO ---
  const notaMediaEquipo = datos.nota_media_equipo ;
  const estrellaEquipo = datos.estrella_equipo ;
  const evaluacionesHechas = datos.evaluaciones_hechas;
  const totalEquipo = datos.total_equipo 
  const porcentajeEvaluado = ((evaluacionesHechas / totalEquipo) * 100).toFixed(0);

  return (
    <div className="page-container grrhh-container" style={{ maxWidth: "1400px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* TÍTULO  */}
      <div className="perfil-header grrhh-header-jefe">
        <h1 className="grrhh-title" style={{ margin: "0 0 10px 0", fontSize: "2.2rem" }}>👥 Mi Equipo: Visión Estratégica</h1>
        <p className="grrhh-subtitle" style={{ fontSize: "1.1rem" }}>Seguimiento de habilidades, autopercepción y rendimiento de tus colaboradores.</p>
      </div>

   
      {/* GESTIÓN DEL TALENTO          */}
   
      <div className="grrhh-section" style={{ padding: "25px", borderRadius: "16px", border: "1px solid #e2e8f0", background: "#f8fafc", marginBottom: "50px" }}>
        <div style={{ marginBottom: "25px" }}>
          <h2 className="grrhh-section-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <span style={{ color: "#10b981" }}>■</span> 1. Mapa de Talento del Equipo
          </h2>
          <p style={{ color: "#64748b", margin: "5px 0 0 0", fontSize: "1rem" }}>¿Qué saben hacer? ¿Qué habilidades les faltan para dominar su puesto?</p>
        </div>

        {/* TARJETAS DE TALENTO */}
        <div className="grrhh-stats-grid" style={{ marginBottom: "30px" }}>
          
          <div className="grrhh-stat-card">
            <div className="grrhh-stat-label">🎯 Nivel de Preparación</div>
            <div className={`grrhh-stat-value ${porcentajeCumplimiento < 50 ? 'grrhh-badge-red' : ''}`} style={{ marginTop: "5px", fontSize: "1.8rem" }}>
              {porcentajeCumplimiento}%
            </div>
            <div className="grrhh-stat-value-small" style={{ marginTop: "5px", fontSize: "0.8rem", color: "#475569" }}>Puntos reales frente a exigidos</div>
          </div>

          <div className="grrhh-stat-card" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div className="grrhh-stat-label" style={{ color: "#16a34a" }}>🎓 Perfil más Titulado</div>
            <div className="grrhh-stat-value-small" style={{ marginTop: "10px", color: "#14532d", fontSize: "1.1rem", fontWeight: 700 }}>{masFormado}</div>
            <div className="grrhh-stat-value-small" style={{ marginTop: "5px", color: "#16a34a" }}>Mayor número de titulaciones</div>
          </div>

          <div className="grrhh-stat-card" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <div className="grrhh-stat-label" style={{ color: "#dc2626" }}>⚠️ Prioridad de Apoyo</div>
            <div className="grrhh-stat-value-small" style={{ marginTop: "10px", color: "#7f1d1d", fontSize: "1.1rem", fontWeight: 700 }}>{alertaCompetencia}</div>
            <div className="grrhh-stat-value-small" style={{ marginTop: "5px", color: "#dc2626" }}>Acumula más competencias bajas</div>
          </div>

        </div>

        {/* GRÁFICOS DE TALENTO */}
        <div className="grrhh-charts-grid">
          
          <section className="grafico-card grrhh-chart-wrapper">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "5px", color: "#1e293b" }}>¿Cómo se ven vs. Cómo los ves?</h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "20px" }}>Comparativa de notas: Autoevaluación frente a tu valoración</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={datos.niveles_por_competencia} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="grupo" tick={{fontSize: 10}} />
                <YAxis />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Legend />
                <Bar dataKey="media_autoevaluacion" name="Se ponen" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="media_jefe" name="Tú les pones" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="grafico-card grrhh-chart-wrapper">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "5px", color: "#1e293b" }}>Brechas de Expectativa</h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "20px" }}>¿En qué competencias hay mayor desacuerdo?</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={datos.diferencias_jefe_empleado} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="competencia" tick={{fontSize: 10}} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="diferencia" name="Diferencia de puntos" fill="#f5a623" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="grafico-card grrhh-chart-wrapper">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "5px", color: "#1e293b" }}>Volumen Formativo</h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "20px" }}>Empleados que más cursos o títulos han aportado</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={datos.empleados_mas_titulaciones} margin={{ top: 10, right: 10, left: -20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="empleado__nombre" type="category" width={100} tick={{fontSize: 11}} />
                <Tooltip />
                <Bar dataKey="total" name="Titulaciones" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="grafico-card grrhh-chart-wrapper">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "5px", color: "#1e293b" }}>Falta de Conocimientos</h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "20px" }}>Quienes acumulan más notas por debajo de 3</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={datos.top5_bajo_nivel} margin={{ top: 10, right: 10, left: -20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="empleado__nombre" type="category" width={100} tick={{fontSize: 11}} />
                <Tooltip />
                <Bar dataKey="total" name="Competencias Bajas" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

        </div>
      </div>


      {/* GESTIÓN DEL DESEMPEÑO                          */}
   
      <div className="grrhh-section" style={{ padding: "25px", borderRadius: "16px", border: "1px solid #e2e8f0", background: "#f8fafc", marginBottom: "30px" }}>
        
        {/* CABECERA CON DESGLOSE DE ESTADOS ACTUALIZADO */}
        <div style={{ marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <h2 className="grrhh-section-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
              <span style={{ color: "#3b82f6" }}>■</span> 2. Resultados del Desempeño
            </h2>
            <p style={{ color: "#64748b", margin: "5px 0 0 0", fontSize: "1rem" }}>
              Análisis segregado: Consecución de Objetivos vs. Factores de Conducta.
            </p>
          </div>
          
          <div className="grrhh-badges-row">
            <div className="grrhh-badge grrhh-badge-green">
              ✅ Cerradas: {datos.evaluaciones_cerradas || 0}
            </div>
            <div className="grrhh-badge grrhh-badge-yellow">
              📝 Borradores: {datos.evaluaciones_borrador || 0}
            </div>
            <div className="grrhh-badge grrhh-badge-red">
              ⏳ Sin empezar: {datos.evaluaciones_pendientes || 0}
            </div>
          </div>
        </div>

        <div className="grrhh-stats-grid" style={{ marginBottom: "30px" }}>
          
          <div className="grrhh-stat-card" style={{ borderTop: "4px solid #3b82f6" }}>
            <div className="grrhh-stat-label">🎯 Objetivos Colectivos</div>
            <div className="grrhh-stat-value-small" style={{ marginTop: "5px", fontSize: "1.8rem", color: "#0f172a" }}>
              {datos.media_obj_col || "0.0"} <span style={{fontSize:"1rem", fontWeight:"normal", color:"#94a3b8"}}>pts medios</span>
            </div>
          </div>

          <div className="grrhh-stat-card" style={{ borderTop: "4px solid #60a5fa" }}>
            <div className="grrhh-stat-label">👤 Objetivos Individuales</div>
            <div className="grrhh-stat-value-small" style={{ marginTop: "5px", fontSize: "1.8rem", color: "#0f172a" }}>
              {datos.media_obj_ind || "0.0"} <span style={{fontSize:"1rem", fontWeight:"normal", color:"#94a3b8"}}>pts medios</span>
            </div>
          </div>

          <div className="grrhh-stat-card" style={{ borderTop: "4px solid #8b5cf6" }}>
            <div className="grrhh-stat-label">⚙️ Factores Tarea</div>
            <div className="grrhh-stat-value-small" style={{ marginTop: "5px", fontSize: "1.8rem", color: "#0f172a" }}>
              {datos.media_tarea || "0.0"} <span style={{fontSize:"1rem", fontWeight:"normal", color:"#94a3b8"}}>/ 4</span>
            </div>
          </div>

          <div className="grrhh-stat-card" style={{ borderTop: "4px solid #a78bfa" }}>
            <div className="grrhh-stat-label">🤝 Factores Contextuales</div>
            <div className="grrhh-stat-value-small" style={{ marginTop: "5px", fontSize: "1.8rem", color: "#0f172a" }}>
              {datos.media_contextual || "0.0"} <span style={{fontSize:"1rem", fontWeight:"normal", color:"#94a3b8"}}>/ 4</span>
            </div>
          </div>

        </div>

        <div className="grrhh-charts-grid">
          
          <section className="grafico-card grrhh-chart-wrapper">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "5px", color: "#1e293b" }}>Puntos de Mejora (Factores)</h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "20px" }}>Las dimensiones donde el equipo obtiene peor nota media (escala 1-4)</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={datos.peores_factores} margin={{ top: 10, right: 20, left: -10, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 4]} />
                <YAxis dataKey="dimension__nombre" type="category" width={140} tick={{fontSize: 10}} />
                <Tooltip formatter={(value) => [value, "Nota Media"]} />
                <Bar dataKey="media" name="Nota Media" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20}>
                  {
                    (datos.peores_factores || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.dimension__bloque === 'TAREA' ? '#f43f5e' : '#fb923c'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{display: "flex", gap: "10px", justifyContent: "center", fontSize: "0.8rem", marginTop: "10px"}}>
               <span style={{color: "#f43f5e"}}>■ Tarea</span>
               <span style={{color: "#fb923c"}}>■ Contextual</span>
            </div>
          </section>

          <section className="grafico-card grrhh-chart-wrapper" style={{ border: "1px solid #fecaca" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "5px", color: "#b91c1c", display: "flex", alignItems: "center", gap: "8px" }}>
              📉 Empleados con Necesidad de Apoyo
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "20px" }}>
              Personas con las medias más bajas en factores de evaluación.
            </p>
            <div className="grrhh-list-container" style={{ paddingRight: "5px", maxHeight: "200px" }}>
              <ul className="grrhh-list">
                {datos.peores_empleados_desempeno?.length === 0 ? (
                  <div className="grrhh-badge grrhh-badge-green" style={{ border: "1px solid #bbf7d0", padding: "15px", borderRadius: "8px", fontWeight: 600, textAlign: "center" }}>
                    ✅ No hay evaluaciones registradas con notas deficientes.
                  </div>
                ) : (
                  datos.peores_empleados_desempeno?.map((e, i) => (
                    <li key={i} className="grrhh-list-item" style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderRadius: "6px" }}>
                      <span style={{fontWeight: "500", fontSize: "0.95rem"}}>{e.evaluacion__empleado__nombre} {e.evaluacion__empleado__apellidos}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                         <span style={{fontSize: "1rem", fontWeight: "bold", color: e.media < 2 ? "#ef4444" : "#f59e0b"}}>
                            {e.media.toFixed(2)}
                         </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>

        </div>
      </div>

    </div>
  );
}
