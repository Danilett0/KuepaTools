import React from 'react';

const CommandSender = ({ commands }) => {


    console.log('Commands to send:', commands);

  const sendCommands = async () => {
    try {
      const response = await fetch('https://danilett0.app.n8n.cloud/webhook/93e39801-5d8a-4c2b-84af-81f837088ea4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
      });

      if (!response.ok) {
        throw new Error('Error al enviar los comandos');
      }

      const data = await response.json();
      alert('Comandos enviados exitosamente');
      return data;
    } catch (error) {
      console.error('Error:', error);
      alert('Error al enviar los comandos: ' + error.message);
    }
  };

  return (
    <div className="command-sender">
      {commands && commands.length > 0 && (
        <button 
          className="btn btn-success"
          onClick={sendCommands}
          style={{ marginTop: '10px' }}
        >
          Enviar Comandos
        </button>
      )}
    </div>
  );
};

export default CommandSender;