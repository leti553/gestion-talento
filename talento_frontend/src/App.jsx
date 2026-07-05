// src/App.jsx
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import MiPerfil from "./pages/MiPerfil";
import MiEquipo from "./pages/MiEquipo";
import DashboardLayout from "./components/layout/DashboardLayout";
//import MiPerfil from "./pages/MiPerfil";
import MisCompetencias from "./pages/MisCompetencias";
import MisMeritos from "./pages/MisMeritos";
import MiHistorial from "./pages/MiHistorial";
import MisTitulaciones from "./pages/MisTitulaciones";
import GraficosJefe from "./components/ui/GraficosJefe";
import DetalleEmpleado from "./pages/DetalleEmpleado";
import GraficosRRHH from "./pages/GraficosRRHH";

import EvaluacionEquipo from "./components/ui/EvaluacionEquipo";
import BuscadorTalentoBasico from "./components/containers/BuscadorTalentoBasico";
//import Administracion from "./components/co/Administracion";




export default function App() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("access"));
  const [perfil, setPerfil] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // Cargar perfil solo si hay token
  useEffect(() => {
    if (!accessToken) return;

    fetch(`${API_URL}/api/mi-perfil/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.clear();
          setAccessToken(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setPerfil(data);
          localStorage.setItem("perfil", JSON.stringify(data));
        }
      });
  }, [accessToken]);

  // Si no hay token ir al login
  if (!accessToken) {
    return (
      <Login
        onLogin={(access, refresh) => {
          localStorage.setItem("access", access);
          localStorage.setItem("refresh", refresh);
          setAccessToken(access);
        }}
      />
    );
  }

  // Si hay token pero aún no cargó el perfil
  if (!perfil) return <p>Cargando perfil...</p>;

  return (
    <BrowserRouter>
      <DashboardLayout perfil={perfil}>
        <Routes>
         
        <Route path="/mis-competencias" element={<MisCompetencias perfil={perfil} />} />
        <Route path="/mis-meritos" element={<MisMeritos perfil={perfil} />} />
        <Route path="/mi-historial" element={<MiHistorial perfil={perfil} />} />
        <Route path="/mis-titulaciones" element={<MisTitulaciones perfil={perfil} />} />
          <Route path="/mi-perfil" element={<MiPerfil />} />
          {perfil.rol === "JEFE" && (
            <>
             <Route path="/mi-equipo" element={<MiEquipo />} />
            <Route path="/mi-equipo/graficos" element={<GraficosJefe />} />
            <Route path="/evaluacion-equipo" element={<EvaluacionEquipo />} />
            <Route path="/equipo/:id" element={<DetalleEmpleado />} />
    </>
          )}
          {perfil.rol==="RRHH" && (
          <>
          <Route path="/mi-equipo" element={<MiEquipo />} />
          <Route path="/mi-equipo/graficos" element={<GraficosJefe />} />
          <Route path="/equipo/:id" element={<DetalleEmpleado />} />
          <Route path="/rrhh/graficos" element={<GraficosRRHH />} />
          <Route path="/evaluacion-equipo" element={<EvaluacionEquipo />} />
          <Route path="/buscador-talento" element={<BuscadorTalentoBasico />} />
    </>
          )}
          <Route path="*" element={<Navigate to="/mi-perfil" />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
}
