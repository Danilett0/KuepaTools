import "./App.css";
import "./styles.css";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import CambiosEstadoBemo from "./CambiosEstadoBemo.jsx";
import SegundaPagina from "./SegundaPagina.jsx";
import ComandosBemoInscripciones from "./ComandosBemoInscripciones.jsx";

function App() {
  return (
    <Router>
      <div className="body">
        <div
          style={{
            backgroundColor: "#042344",
            minHeight: "100vh",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Link to="/" style={{ textDecoration: "none", color: "#fff" }}>
            <h1 style={{ marginBottom: "20px" }}>Kuepa Tools 🛠️</h1>
          </Link>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <Link
              to="/comandos-bemo-inscripciones"
              className="App-link"
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "5px",
                fontWeight: "bold",
              }}
            >
              Inscribir / eliminar estudiantes de grupos
            </Link>
            <Link
              to="/cambios-estado-bemo"
              className="App-link"
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "5px",
                fontWeight: "bold",
              }}
            >
              Cambios de Estado y Estadísticas
            </Link>
            <Link
              to="/Auditar-Estadisticas"
              className="App-link"
              style={{
                padding: "10px 20px",
                backgroundColor: "#ffc107",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "5px",
                fontWeight: "bold",
              }}
            >
              Auditar Estadísticas
            </Link>
          </div>
          <Routes>
            <Route
              path="/comandos-bemo-inscripciones"
              element={<ComandosBemoInscripciones />}
            />
            <Route path="/cambios-estado-bemo" element={<CambiosEstadoBemo />} />
            <Route path="/Auditar-Estadisticas" element={<SegundaPagina />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
