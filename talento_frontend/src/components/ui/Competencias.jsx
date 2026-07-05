import CompetenciaItem from "./CompetenciaItem";

export default function Competencias({
  mochila,
  actualizarNivel,
  actualizarComentario,
  traducirOrigen,
  perfil,
  ayuntamiento
}) {
  return (
    <div className="competencias-grid">
      {mochila.map((c) => (
        <CompetenciaItem
          key={c.id}
          c={c}
          actualizarNivel={actualizarNivel}
          actualizarComentario={actualizarComentario}
          traducirOrigen={traducirOrigen}
          perfil={perfil}
          ayuntamiento={ayuntamiento}
        />
      ))}
    </div>
  );
}
