export default function DatosPersonales({ perfil }) {
  return (
    <section className="ficha-section">
      <h2>📄 Datos personales</h2>
      <p><strong>DNI:</strong> {perfil.dni}</p>
      <p><strong>Email:</strong> {perfil.email}</p>
      <p><strong>Fecha de alta:</strong> {perfil.fecha_alta}</p>
    </section>
  );
}