const axios = require('axios');

const askAI = async (req, res) => {
  try {
    const { mensaje, contexto } = req.body;
    if (!mensaje) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    const aiUrl = process.env.AI_ENGINE_URL || 'http://ai-engine:8000';

    const response = await axios.post(`${aiUrl}/chat`, { 
      mensaje, 
      contexto: contexto || 'sistema' // Por defecto: consulta operativa
    });
    res.json({ respuesta: response.data.respuesta });

  } catch (error) {
    console.error('Error in chat proxy to AI Engine:', error.message);
    console.error('URL intentada:', process.env.AI_ENGINE_URL || 'http://ai-engine:8000');
    const detail = error.response ? error.response.data : error.message;
    res.status(500).json({ 
      error: 'Error comunicando con el Motor IA',
      detalle: detail,
      aiUrlUsada: process.env.AI_ENGINE_URL || 'http://ai-engine:8000 (Default Local)'
    });
  }
};

module.exports = { askAI };
