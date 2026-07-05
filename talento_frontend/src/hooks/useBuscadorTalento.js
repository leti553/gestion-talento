import { useState, useEffect } from "react";

export default function useBuscadorTalento() {
  const [unidades, setUnidades] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);


  const [sugerenciasHabilidades, setSugerenciasHabilidades] = useState([]);
  const [buscandoHabilidades, setBuscandoHabilidades] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("access");

  useEffect(() => {
    if (!token) return;
  
    fetch(`${API_URL}/talento/api/unidades/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setUnidades(data))
      .catch(console.error);
  }, [API_URL, token]);

  // función para buscar en tiempo real
  const buscarSugerencias = async (texto) => {
    if (texto.trim().length < 2) {
      setSugerenciasHabilidades([]);
      return;
    }
    
    setBuscandoHabilidades(true);
    try {
     
      
      const res = await fetch(`${API_URL}/talento/api/habilidades/buscar/?q=${encodeURIComponent(texto)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSugerenciasHabilidades(data);
      }
    } catch (error) {
      console.error("Error buscando habilidades:", error);
    } finally {
      setBuscandoHabilidades(false);
    }
  };

  const buscarTalento = async (habilidadId, nivelMinimo, unidadId) => {
    if (!habilidadId && !unidadId) return; 
    
    setCargando(true);
    setBusquedaRealizada(true);
    
    try {
      const params = new URLSearchParams();
      if (habilidadId) params.append("habilidad_id", habilidadId);
      if (nivelMinimo) params.append("nivel_minimo", nivelMinimo);
      if (unidadId) params.append("unidad_id", unidadId);

      const res = await fetch(`${API_URL}/talento/api/buscador-basico/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Error en el servidor");
      const data = await res.json();
      setResultados(data);
    } catch (error) {
      console.error("Error en la búsqueda:", error);
    } finally {
      setCargando(false);
    }
  };

  return {
    unidades,
    resultados,
    cargando,
    busquedaRealizada,
    sugerenciasHabilidades,
    setSugerenciasHabilidades,
    buscandoHabilidades,
    buscarSugerencias,
    buscarTalento
  };
}