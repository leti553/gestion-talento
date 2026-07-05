import { useState, useEffect } from "react";

export default function AutocompleteHabilidades({ onSelect }) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (busqueda.length < 2) {
      setResultados([]);
      return;
    }

    const delay = setTimeout(() => {
      fetch(`${API_URL}/talento/api/habilidades/buscar/?q=${busqueda}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access")}`
        }
      })
        .then(r => r.json())
        .then(data => setResultados(data))
        .catch(() => setResultados([]));
    }, 300);

    return () => clearTimeout(delay);
  }, [busqueda]);

  return (
    <section className="ficha-section">
      <h2>➕ Añadir habilidad</h2>

      <div className="add-competencia">
        <input
          type="text"
          placeholder="Buscar habilidad..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {resultados.length > 0 && (
          <ul className="autocomplete-list">
            {resultados.map((h) => (
              <li
                key={h.id}
                onClick={() => {
                  onSelect(h.id);
                  setBusqueda("");
                  setResultados([]);
                }}
              >
                {h.nombre}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
