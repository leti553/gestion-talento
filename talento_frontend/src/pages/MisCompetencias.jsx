
import useFichaEmpleado from "../hooks/useFichaEmpleado";

import Competencias from "../components/ui/Competencias";
import AutocompleteHabilidades from "../components/containers/AutocompleteHabilidades";

export default function MisCompetencias() {
  const {
    perfil,
    mochila,
    ayuntamiento,
    añadirHabilidad,
    actualizarNivel,
    actualizarComentario,
    traducirOrigen,
  } = useFichaEmpleado();

  if (!perfil) return <p>Cargando competencias...</p>;

  return (
    <div className="page-container">
      <div className="card">
        <h1>Mis competencias</h1>
        <p className="muted">Gestiona tus habilidades y niveles</p>

        <Competencias
          mochila={mochila}
          actualizarNivel={actualizarNivel}
          actualizarComentario={actualizarComentario}
          traducirOrigen={traducirOrigen}
          perfil={perfil}
          ayuntamiento={ayuntamiento}
        />
      </div>

      <div className="card">
        <AutocompleteHabilidades onSelect={añadirHabilidad} />
      </div>
    </div>
  );
}
