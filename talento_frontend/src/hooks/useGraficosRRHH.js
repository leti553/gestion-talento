// src/hooks/useGraficosRRHH.js
import { useState, useEffect } from "react";

export function useGraficosRRHH() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;
  useEffect(() => {
    const fetchDatos = async () => {
      setLoading(true);
      setError(false);
      const token = localStorage.getItem("access");

      const url = unidadSeleccionada 
        ? `${API_URL}/talento/api/rrhh/graficos/?unidad_id=${unidadSeleccionada}`
        : `${API_URL}/talento/api/rrhh/graficos/`;

      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error("Error en la respuesta del servidor");
        }

        const data = await response.json();
        setDatos(data);
      } catch (err) {
        console.error("Error cargando gráficas RRHH:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, [unidadSeleccionada]);

  return {
    datos,
    cargando: loading,
    error,
    unidadSeleccionada,
    cambiarUnidad: setUnidadSeleccionada
  };
}