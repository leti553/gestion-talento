// src/components/layout/DashboardLayout.jsx
import Sidebar from "./Sidebar";

export default function DashboardLayout({ perfil, children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar perfil={perfil} />

      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}
