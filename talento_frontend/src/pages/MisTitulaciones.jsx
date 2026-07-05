import useFichaEmpleado from "../hooks/useFichaEmpleado";
import Titulaciones from "../components/ui/Titulaciones";

export default function MisTitulaciones() {
  const {
    titulaciones,
    cualificaciones,
    añadirTitulacion,
    actualizarTitulacion,
    eliminarTitulacion,
  } = useFichaEmpleado();

  return (
    <div className="page-container">
      <h1>Mis Titulaciones</h1>

      <Titulaciones
        titulaciones={titulaciones || []}
        cualificaciones={cualificaciones || []}
        añadirTitulacion={añadirTitulacion}
        actualizarTitulacion={actualizarTitulacion}
        eliminarTitulacion={eliminarTitulacion}
      />
    </div>
  );
}
