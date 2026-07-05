import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from "recharts";
import {useGraficosRRHH} from "../hooks/useGraficosRRHH";

const COLORS = ["#3b82f6", "#10b981", "#f5a623", "#ef4444", "#8b5cf6"];

export default function GraficosRRHH() {
  const { datos, cargando, error, unidadSeleccionada, cambiarUnidad } = useGraficosRRHH();

  if (cargando) {
    return (
      <div className="grrhh-loading-container">
        <div className="loader">Cargando métricas de Recursos Humanos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grrhh-error-container">
        ❌ No se pudieron cargar los datos de RRHH.
      </div>
    );
  }

  if (!datos) return null;

  // --- CÁLCULOS DINÁMICOS ---
  const anioCampana = new Date().getFullYear() - 1;
  
  const porcentajeCumplimiento = datos.nivel_posible_vs_real?.posible 
    ? ((datos.nivel_posible_vs_real.real / datos.nivel_posible_vs_real.posible) * 100).toFixed(1)
    : 0;

  return (
    <div className="page-container grrhh-page-wrapper">
      
      {/* TÍTULO GLOBAL Y FILTRO */}
      <div className="perfil-header grrhh-header-banner">
        <div>
          <h1 className="grrhh-header-title">🏢 Cuadro de Mando RRHH</h1>
          <p className="grrhh-header-subtitle">Visión global de talento y desempeño de la organización.</p>
        </div>

        {/* SELECTOR DE UNIDADES */}
        {datos.unidades && datos.unidades.length > 0 && (
          <div className="grrhh-filter-box">
            <label className="grrhh-filter-label">Filtrar Unidad:</label>
            <select 
              value={unidadSeleccionada || ""}
              onChange={(e) => cambiarUnidad && cambiarUnidad(e.target.value)}
              className="grrhh-filter-select"
            >
              <option value="">🏢 Toda la Organización</option>
              {datos.unidades.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* SECCIÓN 1: GESTIÓN DEL TALENTO (COMPETENCIAS) */}
      <div className="grrhh-section-box">
        <div className="grrhh-section-header">
          <h2 className="grrhh-section-title">
            <span className="grrhh-dot-green">■</span> 1. Estado Global del Talento
          </h2>
          <p className="grrhh-section-desc">Distribución de habilidades y cobertura de puestos.</p>
        </div>

        <div className="grrhh-metrics-grid">
          <div className="grrhh-metric-card">
            <div className="grrhh-metric-label">👥 Plantilla Activa</div>
            <div className="grrhh-metric-value">
              {datos.total_empleados || 0}
            </div>
            <div className="grrhh-metric-subtext">Empleados en la selección actual</div>
          </div>

          <div className="grrhh-metric-card">
            <div className="grrhh-metric-label">🎯 Cumplimiento de Puestos</div>
            <div className={`grrhh-metric-value ${porcentajeCumplimiento < 50 ? 'grrhh-text-danger' : 'grrhh-text-success'}`}>
              {porcentajeCumplimiento}%
            </div>
            <div className="grrhh-metric-subtext">Puntos reales vs exigidos globalmente</div>
          </div>
        </div>

        {/* GRÁFICOS DE TALENTO */}
        <div className="competencias-grid grrhh-charts-grid">
          
          <section className="grafico-card grrhh-chart-card">
            <h3 className="grrhh-chart-title">Distribución de Niveles</h3>
            <p className="grrhh-chart-desc">Porcentaje de notas otorgadas por los responsables</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={datos.distribucion_niveles} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {(datos.distribucion_niveles || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, `Nivel ${name}`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </section>

          <section className="grafico-card grrhh-chart-card">
            <h3 className="grrhh-chart-title">Nota Media por Puesto</h3>
            <p className="grrhh-chart-desc">Comparativa de preparación entre distintos roles</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={datos.niveles_por_puesto} margin={{ top: 10, right: 10, left: -20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 4]} />
                <YAxis dataKey="puesto_actual__nombre" type="category" width={120} tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="media" name="Nota Media" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="grafico-card grrhh-chart-card grrhh-card-danger">
            <h3 className="grrhh-chart-title-danger">
              ⚠️ Pendientes de Completar Mochila
            </h3>
            <p className="grrhh-chart-desc">
              Empleados que no han realizado su autoevaluación.
            </p>
            <div className="grrhh-list-scrollable">
              <ul className="grrhh-list">
                {datos.empleados_sin_rellenar?.length === 0 ? (
                  <div className="grrhh-alert-success">
                    ✅ Toda la plantilla ha rellenado sus competencias.
                  </div>
                ) : (
                  datos.empleados_sin_rellenar?.map((e, i) => (
                    <li key={i} className="grrhh-list-item">
                      <span className="grrhh-list-item-name">{e.nombre} {e.apellidos}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>

        </div>
      </div>

    
      {/* SECCIÓN 2: GESTIÓN DEL DESEMPEÑO */}
      <div className="grrhh-section-box">
        
        {/* CABECERA DINÁMICA DE DESEMPEÑO */}
        <div className="grrhh-s2-header">
          <div>
            <h2 className="grrhh-section-title">
              <span className="grrhh-dot-blue">■</span> 2. Campaña de Desempeño {anioCampana}
            </h2>
            <p className="grrhh-section-desc">
              Monitorización de la campaña actual: Consecución de Objetivos vs. Factores de Conducta.
            </p>
          </div>
          
          <div className="grrhh-badges-group">
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

        <div className="grrhh-metrics-grid grrhh-metrics-grid-4">
          
          <div className="grrhh-metric-card grrhh-border-top-blue">
            <div className="grrhh-metric-label">🎯 Objetivos Colectivos</div>
            <div className="grrhh-metric-value">
              {datos.media_obj_col || "0.0"} <span className="grrhh-metric-unit">pts medios</span>
            </div>
          </div>

          <div className="grrhh-metric-card grrhh-border-top-lightblue">
            <div className="grrhh-metric-label">👤 Objetivos Individuales</div>
            <div className="grrhh-metric-value">
              {datos.media_obj_ind || "0.0"} <span className="grrhh-metric-unit">pts medios</span>
            </div>
          </div>

          <div className="grrhh-metric-card grrhh-border-top-purple">
            <div className="grrhh-metric-label">⚙️ Factores Tarea</div>
            <div className="grrhh-metric-value">
              {datos.media_tarea || "0.0"} <span className="grrhh-metric-unit">/ 4</span>
            </div>
          </div>

          <div className="grrhh-metric-card grrhh-border-top-lightpurple">
            <div className="grrhh-metric-label">🤝 Factores Contextuales</div>
            <div className="grrhh-metric-value">
              {datos.media_contextual || "0.0"} <span className="grrhh-metric-unit">/ 4</span>
            </div>
          </div>

        </div>

        <div className="competencias-grid grrhh-charts-grid">
          
          <section className="grafico-card grrhh-chart-card">
            <h3 className="grrhh-chart-title">Puntos de Mejora Global (Factores)</h3>
            <p className="grrhh-chart-desc">Las dimensiones de la organización con peor nota media.</p>
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
            <div className="grrhh-legend-custom">
               <span className="grrhh-legend-item-tarea">■ Tarea</span>
               <span className="grrhh-legend-item-contextual">■ Contextual</span>
            </div>
          </section>

          <section className="grafico-card grrhh-chart-card grrhh-card-danger">
            <h3 className="grrhh-chart-title-danger">
              📉 Empleados Críticos (Desempeño)
            </h3>
            <p className="grrhh-chart-desc">
              Personas con las medias más bajas en factores de evaluación este año.
            </p>
            <div className="grrhh-list-scrollable">
              <ul className="grrhh-list">
                {datos.peores_empleados_desempeno?.length === 0 ? (
                  <div className="grrhh-alert-success">
                    ✅ No hay evaluaciones registradas con notas deficientes.
                  </div>
                ) : (
                  datos.peores_empleados_desempeno?.map((e, i) => (
                    <li key={i} className="grrhh-list-item grrhh-list-item-flex">
                      <span className="grrhh-list-item-name">{e.evaluacion__empleado__nombre} {e.evaluacion__empleado__apellidos}</span>
                      <div className="grrhh-list-item-score-box">
                         <span className={`grrhh-list-item-score ${e.media < 2 ? 'grrhh-text-danger' : 'grrhh-text-warning'}`}>
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