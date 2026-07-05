import { useEffect, useState } from "react";
import FichaEmpleado from "../components/containers/FichaEmpleado";

export default function MiPerfil() {
  const [perfil, setPerfil] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;
  useEffect(() => {
    const token = localStorage.getItem("access");
    fetch(`${API_URL}/api/mi-perfil/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setPerfil(data))
      .catch((err) => console.error("Error en MiPerfil:", err));
  }, []);

  if (!perfil) return <div className="loader">Cargando tu perfil...</div>;

  return (
    <div className="page-container">
      <FichaEmpleado 
        perfil={perfil} 
        perfilExterno={false} // Es el jefe
      />
    </div>
  );
}