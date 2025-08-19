import React from 'react';
import { useNavigate } from 'react-router-dom';

const SegundaPagina = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Auditoría de Estadísticas</h1>
      <p>Aquí puedes ver las estadísticas de auditoría.</p>
      <button onClick={() => navigate('/')}>Volver</button>
    </div>
  );
};

export default SegundaPagina;
