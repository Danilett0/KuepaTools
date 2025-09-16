const API_URL = 'https://danilett0.app.n8n.cloud/webhook/93e39801-5d8a-4c2b-84af-81f837088ea4';

export const sendCommands = async (commands) => {
  try {
    const response = await fetch(API_URL, {
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
    return { success: true, data };
  } catch (error) {
    console.error('Error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};