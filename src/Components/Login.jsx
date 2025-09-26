import React, { useState, memo } from "react";
import "../Styles/styles.css";
import { useAuth } from "../context/AuthContext";
import Lottie from "lottie-react";
import groovyWalkAnimation from "../Login.json";

const Login = memo(() => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Limpiar error anterior
    
    const result = await login(username, password);

    if (!result.success) {
      setError(result.message || "Error al iniciar sesión");
      setPassword("");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Bienvenido a Kuepa Tools</h2>
        <Lottie
            style={{width: "300px", margin: "0 auto" }}
          animationData={groovyWalkAnimation}
          loop={true}
        />

        <form onSubmit={handleSubmit}>
          <div className="password-input">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su usuario"
              required
              autoComplete="username"
            />
          </div>
          <div className="password-input">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <i className="fas fa-eye-slash"></i>
              ) : (
                <i className="fas fa-eye"></i>
              )}
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
});

Login.displayName = "Login";

export default Login;
