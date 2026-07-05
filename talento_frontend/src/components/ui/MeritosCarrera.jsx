import React, { useState } from "react";

export default function MeritosCarrera({ meritos, actualizarMerito, eliminarMerito }) {
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({});

  const startEdit = (i, m) => {
    setEditIndex(i);
    setForm({ ...m });
  };

  const saveEdit = () => {
    actualizarMerito(form.id, form);
    setEditIndex(null);
  };

  return (
    <section>
      <div style={{ borderBottom: "2px solid #f1f5f9", paddingBottom: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "1.2rem" }}>🏅</span>
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>Historial Registrado</h2>
      </div>

      {meritos?.length === 0 ? (
        <div style={{ padding: "30px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
          No hay méritos registrados actualmente. Utiliza el formulario superior para añadir uno.
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem", minWidth: "800px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", color: "#475569", width: "20%" }}>Bloque</th>
                <th style={{ padding: "12px 16px", color: "#475569", width: "30%" }}>Título</th>
                <th style={{ padding: "12px 16px", color: "#475569", width: "15%" }}>Entidad</th>
                <th style={{ padding: "12px 16px", color: "#475569", width: "10%" }}>Fecha</th>
                <th style={{ padding: "12px 16px", color: "#475569", width: "10%", textAlign: "center" }}>Horas</th>
                <th style={{ padding: "12px 16px", color: "#475569", width: "15%", textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {meritos?.map((m, i) => {
                const isEditing = editIndex === i;

                return isEditing ? (
                  /* MODO EDICIÓN */
                  <tr key={m.id || i} style={{ background: "#eff6ff", borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px" }}>
                      <select value={form.bloque} onChange={(e) => setForm({ ...form, bloque: e.target.value })} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #93c5fd", fontSize: "0.8rem" }}>
                        <option value="AREA_III">Área III</option>
                        <option value="AREA_IV">Área IV</option>
                      </select>
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #93c5fd", fontSize: "0.8rem" }} />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input value={form.entidad} onChange={(e) => setForm({ ...form, entidad: e.target.value })} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #93c5fd", fontSize: "0.8rem" }} />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #93c5fd", fontSize: "0.8rem" }} />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input type="number" value={form.horas} onChange={(e) => setForm({ ...form, horas: e.target.value })} style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #93c5fd", fontSize: "0.8rem", textAlign: "center" }} />
                    </td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                        <button onClick={saveEdit} style={{ padding: "4px 8px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}>✔</button>
                        <button onClick={() => setEditIndex(null)} style={{ padding: "4px 8px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}>✖</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* MODO LECTURA */
                  <tr key={m.id || i} className="table-row-hover" style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: m.bloque === "AREA_III" ? "#e0f2fe" : "#fef3c7", color: m.bloque === "AREA_III" ? "#0369a1" : "#b45309", padding: "4px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "bold" }}>
                        {m.bloque === "AREA_III" ? "Área III" : m.bloque === "AREA_IV" ? "Área IV" : m.bloque}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1e293b" }}>{m.titulo}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{m.entidad}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{m.fecha ? new Date(m.fecha).toLocaleDateString() : "-"}</td>
                    <td style={{ padding: "12px 16px", color: "#475569", textAlign: "center", fontWeight: "600" }}>{m.horas} h</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button onClick={() => startEdit(i, m)} style={{ padding: "6px", background: "#f1f5f9", color: "#2563eb", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center" }} title="Editar">
                          ✏️
                        </button>
                        <button onClick={() => { if(window.confirm("¿Seguro que deseas eliminar este mérito?")) eliminarMerito(m.id); }} style={{ padding: "6px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center" }} title="Eliminar">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}