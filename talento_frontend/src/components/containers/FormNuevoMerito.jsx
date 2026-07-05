import React, { useState } from "react";

export default function FormNuevoMerito({ onAdd }) {
  const [form, setForm] = useState({
    titulo: "",
    bloque: "",
    entidad: "",
    fecha: "",
    horas: ""
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault(); // Previene la recarga del formulario
    if (!form.titulo || !form.bloque) {
      alert("Por favor, completa al menos el título y el bloque.");
      return;
    }

    onAdd({
      titulo: form.titulo,
      bloque: form.bloque,
      entidad: form.entidad,
      fecha: form.fecha,
      horas: Number(form.horas || 0)
    });

    setForm({ titulo: "", bloque: "", entidad: "", fecha: "", horas: "" });
  }

  return (
    <section>
      <div style={{ borderBottom: "2px solid #f1f5f9", paddingBottom: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "1.2rem" }}>➕</span>
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>Añadir Nuevo Mérito</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "end" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#475569" }}>Título del Mérito *</label>
          <input type="text" name="titulo" placeholder="Ej. Curso de Liderazgo" value={form.titulo} onChange={handleChange} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} required />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#475569" }}>Bloque / Área *</label>
          <select value={form.bloque} onChange={(e) => setForm({ ...form, bloque: e.target.value })} required style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}>
            <option value="">Selecciona un bloque…</option>
            <option value="AREA_III">Área III – Formación y Transferencia</option>
            <option value="AREA_IV">Área IV – Innovación e Investigación</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#475569" }}>Entidad Emisora</label>
          <input type="text" name="entidad" placeholder="Ej. INAP, Universidad..." value={form.entidad} onChange={handleChange} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} />
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 2 }}>
            <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#475569" }}>Fecha</label>
            <input type="date" name="fecha" value={form.fecha} onChange={handleChange} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#475569" }}>Horas</label>
            <input type="number" name="horas" placeholder="0" min="0" value={form.horas} onChange={handleChange} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }} />
          </div>
        </div>

        <div style={{ alignSelf: "end" }}>
          <button type="submit" style={{ width: "100%", padding: "10px 16px", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" }}>
            💾 Guardar Mérito
          </button>
        </div>

      </form>
    </section>
  );
}