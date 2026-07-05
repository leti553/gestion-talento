import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import FichaEmpleado from "../components/containers/FichaEmpleado";

export default function DetalleEmpleado() {
  const { id } = useParams();
  const location = useLocation();
  
  // Datos que vienen desde el link
  const [empleado, setEmpleado] = useState(location.state?.datosBasicos || null);
  const [error, setError] = useState(null);
  
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchExpediente = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await fetch(`${API_URL}/talento/api/empleado/${id}/competencias/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("No se pudo cargar el expediente");
        
        const data = await res.json();
        // Juntamos datos básicos con el resto
        setEmpleado(prev => ({
          ...prev,
          ...data.empleado,
          competencias: data.competencias
        }));
      } catch (err) {
        setError(err.message);
      }
    };

    fetchExpediente();
  }, [id]);

  if (error) return <div className="error">{error}</div>;
  if (!empleado) return <div className="loader">Cargando...</div>;

  return (
    <div className="page-container">
      <FichaEmpleado 
        perfil={empleado} 
        perfilExterno={true} // se trata del subordinado
      />
    </div>
  );
}