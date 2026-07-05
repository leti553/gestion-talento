// src/hooks/useGraficosJefe.js
import { useState, useEffect } from "react";

export default function useGraficosJefe() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchDatos = async () => {
      setCargando(true);
      setError(null);
      const token = localStorage.getItem("access");

      try {
        const response = await fetch(`${API_URL}/talento/api/mi-equipo/graficos-avanzados/`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error("Error al obtener los datos del equipo");
        }

        const data = await response.json();
        setDatos(data);
      } catch (err) {
        console.error("Error cargando gráficos del equipo:", err);
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchDatos();
  }, []);

  return { datos, cargando, error };
}