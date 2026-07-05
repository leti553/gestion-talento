export default function HistorialLaboral({ historial }) {
  return (
    <section className="ficha-section">
      <h2>📚 Historial profesional</h2>

      {historial?.length === 0 && (
        <p>No hay historial registrado.</p>
      )}

      {historial?.map((h, i) => (
        <div className="card" key={i}>
          <p><strong>Puesto:</strong> {h.puesto?.nombre}</p>
          <p><strong>Unidad:</strong> {h.unidad_organica?.nombre}</p>
          <p><strong>Desde:</strong> {h.fecha_inicio}</p>
          <p><strong>Hasta:</strong> {h.fecha_fin || "Actual"}</p>
        </div>
      ))}
    </section>
  );
}