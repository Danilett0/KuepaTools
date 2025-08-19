import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CambiosEstadoBemo = () => {
  const [estado, setEstado] = useState('');
  const navigate = useNavigate();

  const handleEstadoChange = (event) => {
    setEstado(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Lógica para manejar el cambio de estado
    console.log(`Estado cambiado a: ${estado}`);
  };

  return (
    <div>
      <h1>Cambios de Estado</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="estado">Selecciona un estado:</label>
        <select id="estado" value={estado} onChange={handleEstadoChange}>
          <option value="">--Seleccionar--</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <button type="submit">Guardar</button>
      </form>
      <button onClick={() => navigate('/')}>Volver</button>
    </div>
  );
};

export default CambiosEstadoBemo;
