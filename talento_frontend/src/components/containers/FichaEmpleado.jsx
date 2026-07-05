import { useState } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import useFichaEmpleado from "../../hooks/useFichaEmpleado";
import GraficosCompetencias from "../ui/GraficosCompetencias";
import GestionarCompetenciasEquipo from "./GestionarCompetenciasEquipo";

export default function FichaEmpleado({ perfil, perfilExterno, alCerrar }) {
  const [verEvaluacion, setVerEvaluacion] = useState(false);
  const [verExpediente, setVerExpediente] = useState(false);

  const {
    mochila: mochilaDeLaJefa,
    ayuntamiento,
    traducirOrigen
  } = useFichaEmpleado();

  // Control de carga
  if (!perfil) {
    return <p className="ficha-loading">Cargando información del perfil...</p>;
  }

  // Si es externo, el backend mete los datos dentro de 'perfil.empleado'
  const dataEmpleado = perfilExterno && perfil.empleado ? perfil.empleado : perfil;
  console.log("Datos que llegan del servidor:", dataEmpleado);
  const nombreEmpleado = dataEmpleado.nombre || "";
  const apellidosEmpleado = dataEmpleado.apellidos || "";
  const iniciales = (nombreEmpleado?.[0] || "") + (apellidosEmpleado?.[0] || "");
  
  const nombrePuesto = dataEmpleado.puesto_actual?.nombre || dataEmpleado.puesto || "Puesto no asignado";
  const nombreUnidad = dataEmpleado.unidad_organica?.nombre || dataEmpleado.unidad || "Unidad no asignada";
  const nombreJefe = dataEmpleado.nombre_jefe || perfil.nombreJefe || perfilExterno.nombreJefe ||
                   (dataEmpleado.jefe?.nombre ? `${dataEmpleado.jefe.nombre} ${dataEmpleado.jefe.apellidos || ''}`.trim() : dataEmpleado.jefe) || 
                   "Sin responsable asignado";

  // SELECCIÓN DINÁMICA DE COMPETENCIAS 
  const mochila = perfilExterno 
    ? (perfil.competencias || []) 
    : (perfil.competencias || perfil.mis_competencias || perfil.mochila || mochilaDeLaJefa || []);

  if (verEvaluacion) {
    return <GestionarCompetenciasEquipo empleadoId={dataEmpleado.id || perfil.id} alCerrar={() => setVerEvaluacion(false)} />;
  }
  
  const campoNivel = perfilExterno ? "nivel_jefe" : "nivel_autoevaluacion";

  const resumen = {
    sinEvaluar: mochila.filter(c => Number(c[campoNivel] ?? 0) === 0).length,
    porDebajo3: mochila.filter(c => {
      const n = Number(c[campoNivel] ?? 0);
      return n > 0 && n < 3;
    }).length,
    porOrigen: {
      RPT: mochila.filter(c => c.origen === "RPT").length,
      ESCO_OBL: mochila.filter(c => c.origen === "ESCO_OBL").length,
      ESCO_OPC: mochila.filter(c => c.origen === "ESCO_OPC").length,
      EXTRA: mochila.filter(c => c.origen === "EXTRA").length,
    }
  };

  const resumenNiveles = [
    { categoria: "Sin evaluar", valor: resumen.sinEvaluar },
    { categoria: "Nivel 1-2", valor: resumen.porDebajo3 }, 
    { categoria: "Nivel 3", valor: mochila.filter(c => Number(c[campoNivel]) === 3).length },
    { categoria: "Nivel 4", valor: mochila.filter(c => Number(c[campoNivel]) === 4).length }
  ];

  const resumenTipos = [
    { categoria: traducirOrigen("RPT", nombrePuesto, ayuntamiento), valor: resumen.porOrigen.RPT },
    { categoria: traducirOrigen("ESCO_OBL", nombrePuesto, ayuntamiento), valor: resumen.porOrigen.ESCO_OBL },
    { categoria: traducirOrigen("ESCO_OPC", nombrePuesto, ayuntamiento), valor: resumen.porOrigen.ESCO_OPC },
    { categoria: traducirOrigen("EXTRA", nombrePuesto, ayuntamiento), valor: resumen.porOrigen.EXTRA }
  ];

  // EXTRACCIÓN DE LA EVALUACIÓN 
  const evaluacionesArray = perfil.evaluaciones || dataEmpleado.evaluaciones || [];
  const ultimaEvaluacion = evaluacionesArray.length > 0 ? evaluacionesArray[evaluacionesArray.length - 1] : null;

  // Variables para la evaluación
  const puntosIndiv = ultimaEvaluacion?.puntos_objetivos_individuales ?? 0;
  const puntosColec = ultimaEvaluacion?.puntos_objetivos_colectivos ?? 0;
  const puntosTarea = ultimaEvaluacion?.puntos_tarea ?? ultimaEvaluacion?.puntos_formacion_III ?? 0;
  const puntosContext = ultimaEvaluacion?.puntos_contextual ?? ultimaEvaluacion?.puntos_innovacion_IV ?? 0;
  const notaTotal = ultimaEvaluacion?.nota_total ?? 0;

  // DETECTAR COMPETENCIAS BAJAS 
  const competenciasParaFormar = mochila.filter(c => {
    const nivel = Number(c[campoNivel] ?? 0);
    return nivel > 0 && nivel < 3;
  });

  // DATOS PARA EL GRÁFICO DE ARAÑA 
  let datosGraficoAraña = mochila.map(c => {
    const nombreReal = c.habilidad?.nombre || c.nombre || "Competencia";
    return {
      competencia: nombreReal.length > 25 ? nombreReal.substring(0, 25) + "..." : nombreReal,
      Nivel: Number(c[campoNivel] ?? 0),
    };
  });

  if (datosGraficoAraña.length === 1) {
    datosGraficoAraña.push({ competencia: " ", Nivel: 0 }, { competencia: "  ", Nivel: 0 });
  } else if (datosGraficoAraña.length === 2) {
    datosGraficoAraña.push({ competencia: " ", Nivel: 0 });
  }

  // Paleta requerida para los componentes de Recharts
  const theme = {
    textMain: "#1e293b", 
    textMuted: "#64748b", 
    colorPurpura: "#8b5cf6",
    colorNaranja: "#f97316"
  };

  if (verExpediente) {
    return (
      <div className="ficha-expediente-container">
        <div className="ficha-expediente-wrapper">
          <button onClick={() => setVerExpediente(false)} className="ficha-btn-volver">
            ← Volver al panel competencial
          </button>
          
          <h2 className="ficha-expediente-titulo">
            Expediente Completo: {nombreEmpleado} {apellidosEmpleado}
          </h2>
          
          {/* Tarjeta de Historial */}
          <div className="ficha-expediente-card">
            <h3 className="ficha-card-titulo-azul">🏢 Historial de Puestos</h3>
            {dataEmpleado.historial && dataEmpleado.historial.length > 0 ? (
              <ul className="ficha-lista-limpia">
                {dataEmpleado.historial.map((h, i) => (
                  <li key={i} className="ficha-lista-item">
                    <div className="ficha-item-nombre">{h.puesto?.nombre || "Puesto sin especificar"}</div>
                    <div className="ficha-item-meta">
                      Destino: {h.unidad_organica?.nombre || "Unidad sin especificar"} <br/>
                      Período: {h.fecha_inicio} a {h.fecha_fin || "La actualidad"}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="ficha-texto-vacio">No hay registros de movimientos en el historial.</p>}
          </div>

          {/* Tarjeta de Titulaciones */}
          <div className="ficha-expediente-card">
            <h3 className="ficha-card-titulo-verde">🎓 Titulaciones Oficiales</h3>
            {dataEmpleado.titulaciones && dataEmpleado.titulaciones.length > 0 ? (
              <ul className="ficha-lista-limpia">
                {dataEmpleado.titulaciones.map((t, i) => (
                  <li key={i} className="ficha-lista-item">
                    <div className="ficha-item-nombre">{t.cualificacion?.nombre || "Titulación"}</div>
                    <div className="ficha-item-meta">
                      Expedido por: {t.centro_expedidor || "Centro no especificado"} <br/>
                      Fecha de obtención: {t.fecha_obtencion || "Sin fecha"}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="ficha-texto-vacio">No figuran titulaciones registradas.</p>}
          </div>

          {/* Tarjeta de Méritos */}
          <div className="ficha-expediente-card">
            <h3 className="ficha-card-titulo-naranja">🏅 Méritos de Carrera (Formación e Innovación)</h3>
            {dataEmpleado.meritos && dataEmpleado.meritos.length > 0 ? (
              <ul className="ficha-lista-limpia">
                {dataEmpleado.meritos.map((m, i) => (
                  <li key={i} className="ficha-lista-item">
                    <div className="ficha-item-nombre">{m.titulo}</div>
                    <div className="ficha-item-meta">
                      Entidad: {m.entidad} <br/>
                      Carga lectiva: {m.horas} horas (Finalizado el {m.fecha})
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="ficha-texto-vacio">No figuran méritos adicionales aportados.</p>}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="ficha-container">
      <div className="ficha-wrapper">
        
        {/* BOTONERA SUPERIOR */}
        {perfilExterno && (
          <div className="ficha-botonera">
            <button onClick={() => setVerExpediente(true)} className="ficha-btn-secundario">
              📄 Ver Expediente Formativo
            </button>

            {perfilExterno && (
              <button onClick={() => setVerEvaluacion(true)} className="ficha-btn-primario-purpura">
                ⚙️ Evaluar Competencias
              </button>
            )}
          </div>
        )}

        {/* CABECERA DEL PERFIL */}
        <div className="ficha-header-card">
          <div className="ficha-avatar-iniciales">{iniciales}</div>
          <div className="ficha-header-info">
            <h1 className="ficha-header-nombre">{nombreEmpleado} {apellidosEmpleado}</h1>
            <div className="ficha-header-meta">
              <p className="ficha-header-meta-item"><strong>Responsable:</strong> {nombreJefe}</p>
              <p className="ficha-header-meta-item"><strong>Puesto:</strong> {nombrePuesto}</p>
              <p className="ficha-header-meta-item"><strong>Unidad:</strong> {nombreUnidad}</p>
            </div>
          </div>
        </div>

        {/* GRÁFICOS DE DISTRIBUCIÓN */}
        {mochila.length > 0 && (
          <div className="ficha-card">
             <h3 className="ficha-card-subtitulo">Análisis de Distribución</h3>
             <GraficosCompetencias niveles={resumenNiveles} tipos={resumenTipos} />
          </div>
        )}

        {/* GRÁFICO DE ARAÑA + DETECCIÓN DE FORMACIÓN */}
        {mochila.length > 0 && (
          <div className="ficha-grid-dos-columnas">
            
            {/* Gráfico de Araña */}
            <div className="ficha-card ficha-no-margin-bottom">
              <h3 className="ficha-card-subtitulo-main">Mapa Competencial</h3>
              <p className="ficha-card-desc">Representación visual del estado actual</p>
              
              <div className="ficha-grafico-wrapper">
                {datosGraficoAraña.length >= 3 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={datosGraficoAraña}>
                      <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="competencia" tick={{ fill: theme.textMain, fontSize: 11, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 4]} tickCount={5} tick={{ fill: theme.textMuted }} />
                      <Radar
                        name="Nivel Real"
                        dataKey="Nivel"
                        stroke={resumen.porDebajo3 > 0 ? theme.colorNaranja : theme.colorPurpura}
                        strokeWidth={3}
                        fill={resumen.porDebajo3 > 0 ? theme.colorNaranja : theme.colorPurpura}
                        fillOpacity={0.35}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="ficha-grafico-vacio">No hay suficientes datos.</div>
                )}
              </div>
            </div>

            {/* Panel de Formación */}
            <div className="ficha-card-urgente-rojo">
              <h3 className="ficha-formacion-titulo">🎯 Objetivos de Formación</h3>
              <p className="ficha-formacion-desc">
                Competencias clave con un nivel inferior al óptimo (Nivel 3).
              </p>
              
              <div className="ficha-formacion-lista">
                {competenciasParaFormar.length > 0 ? (
                  competenciasParaFormar.map((comp, idx) => (
                    <div key={idx} className="ficha-badge-formacion">
                      <span className="ficha-badge-texto">
                        {comp.habilidad?.nombre || comp.nombre || "Competencia"}
                      </span>
                      <span className="ficha-badge-nivel">
                        NIVEL {comp[campoNivel]}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="ficha-excelente-box">
                    <p className="ficha-excelente-icono">🏆</p>
                    <p className="ficha-excelente-texto">¡Excelente! Nivel óptimo alcanzado.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* MÉTRICAS */}
        <div className="ficha-metricas-grid">
          
          <div className="ficha-metrica-card ficha-metrica-azul">
            <h3 className="ficha-metrica-etiqueta">Sin Evaluar</h3>
            <p className="ficha-metrica-valor">{resumen.sinEvaluar}</p>
          </div>

          <div className="ficha-metrica-card ficha-metrica-rojo">
            <h3 className="ficha-metrica-etiqueta">Nivel Inferior a 3</h3>
            <p className="ficha-metrica-valor">{resumen.porDebajo3}</p>
          </div>

          <div className="ficha-metrica-card ficha-metrica-desglose ficha-metrica-purpura">
            <h3 className="ficha-metrica-etiqueta">Desglose por Origen</h3>
            <div className="ficha-desglose-grid">
              <div className="ficha-desglose-item">
                <span className="ficha-desglose-label">{traducirOrigen("RPT", nombrePuesto, ayuntamiento)}</span>
                <strong className="ficha-desglose-valor">{resumen.porOrigen.RPT}</strong>
              </div>
              <div className="ficha-desglose-item">
                <span className="ficha-desglose-label">{traducirOrigen("ESCO_OBL", nombrePuesto, ayuntamiento)}</span>
                <strong className="ficha-desglose-valor">{resumen.porOrigen.ESCO_OBL}</strong>
              </div>
              <div className="ficha-desglose-item">
                <span className="ficha-desglose-label">{traducirOrigen("ESCO_OPC", nombrePuesto, ayuntamiento)}</span>
                <strong className="ficha-desglose-valor">{resumen.porOrigen.ESCO_OPC}</strong>
              </div>
              <div className="ficha-desglose-item">
                <span className="ficha-desglose-label">{traducirOrigen("EXTRA", nombrePuesto, ayuntamiento)}</span>
                <strong className="ficha-desglose-valor">{resumen.porOrigen.EXTRA}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ÚLTIMA EVALUACIÓN */}
        {ultimaEvaluacion ? (
          <div className="ficha-card">
            <div className="ficha-eval-header">
              <h3 className="ficha-eval-titulo">Evaluación de Desempeño</h3>
              <span className="ficha-eval-badge-anio">
                AÑO {ultimaEvaluacion.año || new Date().getFullYear() - 1}
              </span>
            </div>
            
            <div className="ficha-eval-grid">
              <div className="ficha-eval-block ficha-block-muted">
                <small className="ficha-eval-block-label">Obj. Individuales</small>
                <p className="ficha-eval-block-valor">{puntosIndiv}</p>
              </div>
              
              <div className="ficha-eval-block ficha-block-naranja">
                <small className="ficha-eval-block-label">Obj. Colectivos</small>
                <p className="ficha-eval-block-valor">{puntosColec}</p>
              </div>
              
              <div className="ficha-eval-block ficha-block-verde">
                <small className="ficha-eval-block-label">Dim. de Tareas</small>
                <p className="ficha-eval-block-valor">{puntosTarea}</p>
              </div>
              
              <div className="ficha-eval-block ficha-block-rojo">
                <small className="ficha-eval-block-label">Dim. Contextuales</small>
                <p className="ficha-eval-block-valor">{puntosContext}</p>
              </div>
            </div>

            <div className="ficha-eval-total-container">
              <span className="ficha-eval-total-label">Nota Total Definitiva:</span>
              <span className="ficha-eval-total-valor">{notaTotal}</span>
            </div>
          </div>
        ) : (
          <div className="ficha-card ficha-eval-vacia">
            No hay registros de evaluaciones de desempeño históricas disponibles.
          </div>
        )}

      </div>
    </div>
  );
}