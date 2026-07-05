import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadarChart,
  Radar
} from "recharts";

export default function GraficosCompetencias({ niveles, tipos }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      marginTop: "20px"
    }}>

      {/* GRÁFICO POR NIVELES */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)"
      }}>
        <h3 style={{ marginBottom: "10px", color: "#1e3a8a" }}>
          Distribución por nivel
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={niveles} layout="vertical">
            <XAxis type="number" />
            <YAxis type="category" dataKey="categoria" width={180} />
            <Tooltip />
            <Bar dataKey="valor" fill="#2563eb" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* GRÁFICO POR TIPO */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)"
      }}>
        <h3 style={{ marginBottom: "10px", color: "#1e3a8a" }}>
          Distribución por tipo
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={tipos} layout="vertical">
            <XAxis type="number" />
            <YAxis type="category" dataKey="categoria" width={200} />
            <Tooltip />
            <Bar dataKey="valor" fill="#1e3a8a" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="graficos-container">
  <div className="grafico-card">…</div>
  <div className="grafico-card">…</div>
</div>

      </div>

    </div>
  );
}
