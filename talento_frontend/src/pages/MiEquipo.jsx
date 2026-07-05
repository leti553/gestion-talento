import useMiEquipo from "../hooks/useMiEquipo";
import { Link } from "react-router-dom";


export default function MiEquipo() {
  const { equipo, cargando, error } = useMiEquipo();

  if (cargando) return <div className="loader">Cargando equipo...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <div className="perfil-header" style={{background: "linear-gradient(135deg, #1e293b, #334155)"}}>
        <h1>👥 Mi Equipo</h1>
        <p >Gestión de competencias y expedientes de tus empleados</p>
      </div>

      <div className="competencias-grid">
        {equipo.map((emp) => (
          <Link 
            key={emp.id} 
            to={`/equipo/${emp.id}`} 
            state={{ datosBasicos: emp }} // para que DetalleEmpleado tenga info al instante, el resto se busca
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="competencia-card" style={{ cursor: "pointer", borderLeft: "4px solid #2563eb" }}>
              <h3 className="competencia-nombre">{emp.nombre}</h3>
              <p style={{ color: "#2563eb", fontWeight: "600" }}>{emp.puesto}</p>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", background: "#f1f5f9", padding: "8px", borderRadius: "6px" }}>
                <div><strong>Autoeval:</strong> {emp.media_autoevaluacion || 0}</div>
                <div><strong>Jefe:</strong> {emp.media_jefe || 0}</div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "10px", textAlign: "right" }}>
                Ver empleado →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}