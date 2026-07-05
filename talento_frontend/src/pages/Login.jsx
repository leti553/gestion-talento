import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;
  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch(`${API_URL}/api/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      onLogin(data.access, data.refresh);
    } else {
      setError("El usuario o la contraseña introducidos son incorrectos.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Escudo institucional GESTA */}
        <img 
          src="/gesta.png" 
          alt="Logotipo GESTA" 
          className="login-logo" 
        />
        
        <h2 className="login-title">Plataforma GESTA</h2>
        <p className="login-subtitle">Gestión del Talento Administrativo</p>

        {error && (
          <div className="login-error-box">
            <p className="login-error-text">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label className="login-label">Usuario de acceso</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              placeholder="Ej: pgarcia"
              required
            />
          </div>

          <div className="login-input-group">
            <label className="login-label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="login-button">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}