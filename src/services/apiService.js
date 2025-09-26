const API_URL = process.env.REACT_APP_ENPOINT_N8N_URL;

export const sendCommands = async (commands) => {
  try {
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'usuario': userData.username || 'undefined',
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      throw new Error('Error al enviar los comandos');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};