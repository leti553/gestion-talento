import React from "react";
import useFichaEmpleado from "../hooks/useFichaEmpleado";
import MeritosCarrera from "../components/ui/MeritosCarrera";
import FormNuevoMerito from "../components/containers/FormNuevoMerito";  

export default function MisMeritos() {
  const { perfil, meritos, añadirMerito, eliminarMerito, actualizarMerito } = useFichaEmpleado();

  if (!perfil) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px", color: "#64748b" }}>
        Cargando perfil y méritos...
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px", width: "100%" }}>
      
      {/* Cabecera Corporativa */}
      <div className="perfil-header" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", padding: "24px", borderRadius: "12px", marginBottom: "24px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>🎓 Mis Méritos de Carrera</h1>
          <p style={{ margin: "6px 0 0 0", opacity: 0.8, fontSize: "0.85rem" }}>
            Gestión de historial formativo, investigación y transferencia
          </p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600" }}>
          Total registrados: {meritos?.length || 0}
        </div>
      </div>

      {/* Formulario de Alta */}
      <div className="card" style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        <FormNuevoMerito onAdd={añadirMerito} />
      </div>

      {/* Listado de Méritos */}
      <div className="card" style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        <MeritosCarrera 
          meritos={meritos}
          actualizarMerito={actualizarMerito}
          eliminarMerito={eliminarMerito} 
        />
      </div>

    </div>
  );
}