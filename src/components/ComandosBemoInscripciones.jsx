import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ComandosBemoInscripciones = () => {
  const [comando, setComando] = useState('');
  const navigate = useNavigate();

  const handleComandoChange = (event) => {
    setComando(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Lógica para manejar el comando
    console.log(`Comando ejecutado: ${comando}`);
  };

  return (
    <div>
      <h1>Comandos Bemo Inscripciones</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="comando">Escribe un comando:</label>
        <input
          type="text"
          id="comando"
          value={comando}
          onChange={handleComandoChange}
        />
        <button type="submit">Ejecutar</button>
      </form>
      <button onClick={() => navigate('/')}>Volver</button>
    </div>
  );
};

export default ComandosBemoInscripciones;
