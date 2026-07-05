import { useState } from "react";

export default function Titulaciones({
  titulaciones,
  cualificaciones,
  añadirTitulacion,
  actualizarTitulacion,
  eliminarTitulacion
}) {
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({});

  // Iniciar edición
  const startEdit = (i, t) => {
    setEditIndex(i);
    setForm({
      id: t.id,
      cualificacion: t.cualificacion?.id || t.cualificacion, 
      fecha_obtencion: t.fecha_obtencion || "",
      centro_expedidor: t.centro_expedidor || "",
      horas_totales: t.horas_totales || ""
    });
  };

  // Guardar edición
  const saveEdit = () => {
    actualizarTitulacion(form.id, form);
    setEditIndex(null);
  };

  // Iniciar creación
  const startCreate = () => {
    setEditIndex("new");
    setForm({
      cualificacion: "",
      fecha_obtencion: "",
      centro_expedidor: "",
      horas_totales: ""
    });
  };

  // Guardar creación
  const saveCreate = () => {
    añadirTitulacion(form);
    setEditIndex(null);
  };

  return (
    <section className="ficha-section">
      <h2>🎓 Titulaciones</h2>

      <button onClick={startCreate} className="btn-add">
        ➕ Añadir titulación
      </button>

      <table className="tabla-meritos">
        <thead>
          <tr>
            <th>Titulación</th>
            <th>Fecha</th>
            <th>Centro</th>
            <th>Horas</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {/* FILA DE CREACIÓN */}
          {editIndex === "new" && (
            <tr>
              <td>
                <select
                  value={form.cualificacion}
                  onChange={(e) =>
                    setForm({ ...form, cualificacion: e.target.value })
                  }
                >
                  <option value="">Selecciona…</option>
                  {cualificaciones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </td>

              <td>
                <input
                  type="date"
                  value={form.fecha_obtencion}
                  onChange={(e) =>
                    setForm({ ...form, fecha_obtencion: e.target.value })
                  }
                />
              </td>

              <td>
                <input
                  value={form.centro_expedidor}
                  onChange={(e) =>
                    setForm({ ...form, centro_expedidor: e.target.value })
                  }
                  placeholder="Centro"
                />
              </td>

              <td>
                <input
                  type="number"
                  value={form.horas_totales}
                  onChange={(e) =>
                    setForm({ ...form, horas_totales: e.target.value })
                  }
                  placeholder="Horas"
                />
              </td>

              <td>
                <button onClick={saveCreate}>💾</button>
                <button onClick={() => setEditIndex(null)}>❌</button>
              </td>
            </tr>
          )}

          {/* LISTADO NORMAL */}
          {titulaciones.map((t, i) => {
            const isEditing = editIndex === i;

            return (
              <tr key={t.id}>
                {isEditing ? (
                  <>
                    <td>
                      <select
                        value={form.cualificacion}
                        onChange={(e) =>
                          setForm({ ...form, cualificacion: e.target.value })
                        }
                      >
                        {cualificaciones.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <input
                        type="date"
                        value={form.fecha_obtencion}
                        onChange={(e) =>
                          setForm({ ...form, fecha_obtencion: e.target.value })
                        }
                      />
                    </td>

                    <td>
                      <input
                        value={form.centro_expedidor}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            centro_expedidor: e.target.value
                          })
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        value={form.horas_totales}
                        onChange={(e) =>
                          setForm({ ...form, horas_totales: e.target.value })
                        }
                      />
                    </td>

                    <td>
                      <button onClick={saveEdit}>💾</button>
                      <button onClick={() => setEditIndex(null)}>❌</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{t.cualificacion?.nombre}</td>
                    <td>{t.fecha_obtencion}</td>
                    <td>{t.centro_expedidor}</td>
                    <td>{t.horas_totales}</td>

                    <td>
                      <button onClick={() => startEdit(i, t)}>✏️</button>
                      <button onClick={() => eliminarTitulacion(t.id)}>❌</button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
