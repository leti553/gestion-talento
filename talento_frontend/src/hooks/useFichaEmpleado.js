import { useEffect, useState } from "react";

export default function useFichaEmpleado() {
  const [perfil, setPerfil] = useState(null);
  const [mochila, setMochila] = useState([]);
  const [meritos, setMeritos] = useState([]);
  const [titulaciones, setTitulaciones] = useState([]);
  const [cualificaciones, setCualificaciones] = useState([]);
  const [ayuntamiento, setAyuntamiento] = useState("tu Ayuntamiento");
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("access");
  const actualizarMerito = async (id, datos) => {
  try {
    await fetch(`${API_URL}/talento/api/meritos/${id}/`, {
      
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });
console.log("PATCH DATA:", datos);

    // Recargar perfil
    fetch(`${API_URL}/api/mi-perfil/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setPerfil(data);
        setMeritos(data.mis_meritos || []);
        
      });
  } catch (error) {
    console.error("Error actualizando mérito:", error);
    
  }
};

const eliminarMerito = async (id) => {
  try {
    await fetch(`${API_URL}/talento/api/meritos/${id}/eliminar/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Recargar perfil
    fetch(`${API_URL}/api/mi-perfil/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setPerfil(data);
        setMeritos(data.mis_meritos || []);
      });
  } catch (error) {
    console.error("Error eliminando mérito:", error);
  }
};

  // Cargar perfil y estados iniciales
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/mi-perfil/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setPerfil(data);
        setMochila(data.mochila || []);
        setMeritos(data.mis_meritos || []);
        setTitulaciones(data.detalles_titulaciones || []);
      })
      .catch(() => {});
  }, [token]);

  // Cargar config (ayuntamiento)
  useEffect(() => {
    fetch("/api/config/")
      .then((r) => r.json())
      .then((data) => setAyuntamiento(data.ayuntamiento))
      .catch(() => setAyuntamiento("tu Ayuntamiento"));
  }, []);

  // Añadir habilidad
  function añadirHabilidad(id) {
    fetch(`${API_URL}/talento/api/competencia/nueva/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ habilidad: id }),
    })
      .then((r) => r.json())
      .then((nueva) => setMochila((prev) => [...prev, nueva]));
  }

  // Actualizar nivel
  function actualizarNivel(id, nivel) {
    fetch(`${API_URL}/talento/api/competencia/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nivel_autoevaluacion: nivel }),
    }).then(() => {
      setMochila((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, nivel_autoevaluacion: Number(nivel) } : c
        )
      );
    });
  }

  // Actualizar comentario
  function actualizarComentario(id, texto) {
    fetch(`${API_URL}/talento/api/competencia/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ observaciones_empleado: texto }),
    }).then(() => {
      setMochila((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, observaciones_empleado: texto } : c
        )
      );
    });
  }

  // Añadir mérito
  function añadirMerito(data) {
    fetch(`${API_URL}/talento/api/meritos/nuevo/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then((r) => r.json())
      .then((nuevo) => setMeritos((prev) => [...prev, nuevo]));
  }

  // Traducir origen 
  function traducirOrigen(origen, puesto, ayto = ayuntamiento) {
    switch (origen) {
      case "RPT":
        return `Necesaria el ${ayto}`;
      case "ESCO_OBL":
        return `Obligatoria para ${puesto}`;
      case "ESCO_OPC":
        return `Recomendable para ${puesto}`;
      case "EXTRA":
        return "Otras aportadas por ti";
      default:
        return origen;
    }
  }
   // Cargar cualificaciones
  useEffect(() => {
    fetch(`${API_URL}/talento/api/cualificaciones/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setCualificaciones(data));
  }, [token]);

  // TITULACIONES
  function añadirTitulacion(data) {
    fetch(`${API_URL}/talento/api/titulaciones/nueva/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then((r) => r.json())
      .then((nuevo) => setTitulaciones((prev) => [...prev, nuevo]));
  }

  function actualizarTitulacion(id, data) {
    fetch(`${API_URL}/talento/api/titulaciones/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then((r) => r.json())
      .then((actualizado) =>
        setTitulaciones((prev) =>
          prev.map((t) => (t.id === id ? actualizado : t))
        )
      );
  }

  function eliminarTitulacion(id) {
    fetch(`${API_URL}/talento/api/titulaciones/${id}/eliminar/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).then(() =>
      setTitulaciones((prev) => prev.filter((t) => t.id !== id))
    );
  }

  return {
    perfil,
    mochila,
    meritos,
    titulaciones,
    ayuntamiento,
    añadirHabilidad,
    actualizarNivel,
    actualizarComentario,
    añadirMerito,
    actualizarMerito,
    eliminarMerito,
    traducirOrigen,
    cualificaciones,
    añadirTitulacion,
    actualizarTitulacion,
    eliminarTitulacion,
  };
}
