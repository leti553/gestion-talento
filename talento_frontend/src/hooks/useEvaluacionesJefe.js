import { useState, useEffect, useMemo } from "react";

export function useEvaluacionesJefe() {
  const [empleados, setEmpleados] = useState([]);
  const [unidades, setUnidades] = useState([]); 
  const [esRRHH, setEsRRHH] = useState(false);
  const [unidadId, setUnidadId] = useState("");
  const [anio, setAnio] = useState(new Date().getFullYear() - 1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState({ campo: "nombre_completo", direccion: "asc" });
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 8; // Aumentado ligeramente para mejor vista en RRHH

  const token = localStorage.getItem("access");
  const API_URL = import.meta.env.VITE_API_URL;
 const cargarEquipo = async () => {
    setCargando(true);
    try {
      // Añadimos el parámetro del año a la consulta
      const params = new URLSearchParams({ anio: anio });
      if (unidadId) params.append("unidad_id", unidadId);
      
      const res = await fetch(`${API_URL}/talento/api/jefe/evaluaciones-equipo/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error obteniendo el listado de equipo.");
      const data = await res.json();
      
      setEmpleados(data.empleados || []);
      setUnidades(data.unidades || []);
      setEsRRHH(data.es_rrhh || false);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Recargar cuando cambie el año además del token o unidad
  useEffect(() => { if (token) cargarEquipo(); }, [token, unidadId, anio]);

  //useEffect(() => { if (token) cargarEquipo(); }, [token, unidadId]);

  const cambiarOrden = (campo) => {
    setOrden(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === "asc" ? "desc" : "asc"
    }));
  };

  const datosProcesados = useMemo(() => {
    let filtrados = empleados.filter(emp =>
      emp.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.puesto.toLowerCase().includes(busqueda.toLowerCase())
    );

    filtrados.sort((a, b) => {
      let valA = a[orden.campo];
      let valB = b[orden.campo];
      if (typeof valA === "string") {
        return orden.direccion === "asc" 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      return orden.direccion === "asc" ? valA - valB : valB - valA;
    });

    return filtrados;
  }, [empleados, busqueda, orden]);

  const totalPaginas = Math.ceil(datosProcesados.length / elementosPorPagina) || 1;
  const empleadosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return datosProcesados.slice(inicio, inicio + elementosPorPagina);
  }, [datosProcesados, paginaActual]);

  return {
    empleados: empleadosPaginados,
    totalElementos: datosProcesados.length,
    unidades,
    esRRHH,
    unidadId,
    setUnidadId,
    anio,       
    setAnio,     
    cargando,
    error,
    busqueda,
    setBusqueda,
    orden,
    cambiarOrden,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    refrescar: cargarEquipo
  };
}