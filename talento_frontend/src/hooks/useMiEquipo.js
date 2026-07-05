import { useState, useEffect } from "react";

export default function useMiEquipo() {
  const [equipo, setEquipo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;
  useEffect(() => {
    const token = localStorage.getItem("access");
    
    
    fetch(`${API_URL}/talento/api/mi-equipo/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar el equipo");
        return res.json();
      })
      .then((data) => {
        setEquipo(data);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  return { equipo, cargando, error };
}