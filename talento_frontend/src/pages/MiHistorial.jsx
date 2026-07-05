import HistorialLaboral from "../components/ui/HistorialLaboral";

export default function MiHistorial({ perfil }) {
  return (
    <div className="page-container">
      <h1>Mi historial</h1>
      <HistorialLaboral historial={perfil.historial_puestos} />
    </div>
  );
}
