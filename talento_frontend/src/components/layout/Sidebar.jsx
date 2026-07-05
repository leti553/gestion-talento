// src/components/layout/Sidebar.jsx
import { Link } from "react-router-dom";

export default function Sidebar({ perfil }) {
    //console.log("PERFIL EN SIDEBAR:", perfil);
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Gesta</h2>
      </div>

      <nav className="sidebar-nav">
        <Link to="/mi-perfil">Mi Perfil</Link>
<Link to="/mis-competencias">Mis Competencias</Link>
<Link to="/mis-meritos">Mis Méritos</Link>
<Link to="/mi-historial">Mi Historial</Link>
<Link to="/mis-titulaciones">Mis Titulaciones</Link>

        {perfil.rol === "JEFE" && (
          <>
            <hr />
            <Link to="/mi-equipo">Mi Equipo</Link>
            <Link to="/mi-equipo/graficos">Gráficos del Equipo</Link>
            <Link to="/evaluacion-equipo">Evaluar Desempeño</Link>
          </>
        )}

        {perfil.rol === "RRHH" && (
          <>
          <Link to="/mi-equipo">Mi Equipo</Link>
            <Link to="/mi-equipo/graficos">Gráficos del Equipo</Link>
            <Link to="/rrhh/graficos">Gráficos Globales</Link>
            <Link to="/evaluacion-equipo">Evaluar Desempeño</Link>
            <Link to="/buscador-talento">Buscador de talento</Link>
            <hr />
            <a href="http://localhost:8000/admin/" target="_blank" rel="noopener noreferrer" className="nav-link" 
  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "8px", color: "#cbd5e1", textDecoration: "none" }}
>
  <span>⚙️</span>
  <span>Administración</span>
</a>
            
          </>
        )}
      </nav>

      <button
        className="logout-btn"
        onClick={() => {
          localStorage.clear();
          window.location.href = "/login";
        }}
      >
        Cerrar sesión
      </button>
    </aside>
  );
}
