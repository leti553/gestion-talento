import { useState } from "react";

export default function CompetenciaItem({
  c,
  actualizarNivel,
  actualizarComentario,
  traducirOrigen,
  perfil,
  ayuntamiento
}) {
  const [comentario, setComentario] = useState(c.observaciones_empleado || "");
  const nivel = Number(c.nivel_autoevaluacion ?? 0);

  return (
    <div className={`competencia-card nivel-${nivel}`}>

      {/* Nombre + icono */}
      <div className="competencia-nombre">
        <span className={`icono-nivel n${nivel}`}></span>
        {c.habilidad?.nombre}
      </div>

      {/* Origen */}
      <span
        className={`origen-tag ${
          c.origen === "RPT"
            ? "origen-rpt"
            : c.origen === "ESCO_OBL"
            ? "origen-obligatoria"
            : c.origen === "ESCO_OPC"
            ? "origen-opcional"
            : "origen-extra"
        }`}
      >
        {traducirOrigen(c.origen, perfil.puesto_actual?.nombre, ayuntamiento)}
      </span>

      {/* Barra de nivel */}
      <div className={`barra-nivel n${nivel}`}>
        <div></div>
      </div>

      {/* Selector de nivel */}
      <select
        className="nivel-select"
        value={nivel}
        onChange={(e) => actualizarNivel(c.id, e.target.value)}
      >
        <option value="0">0 - Sin evaluar</option>
        <option value="1">1 - Básico</option>
        <option value="2">2 - Intermedio</option>
        <option value="3">3 - Avanzado</option>
        <option value="4">4 - Experto</option>
        
      </select>

      {/* Comentarios */}
      <textarea
        className="textarea-comentarios"
        placeholder="Añade tus comentarios..."
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        onBlur={(e) => actualizarComentario(c.id, e.target.value)}
      />
    </div>
  );
}
