// services/api.js
import axios from 'axios';
const API_URL = 'https://dirigentes-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 segundos timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para debugging
api.interceptors.request.use(
  config => {
    console.log('📡 Enviando request:', config.method, config.url);
    return config;
  },
  error => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    console.log('✅ Response recibido:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('❌ Error en response:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Mostrar alerta en desarrollo
    if (__DEV__) {
      alert(`Error de conexión: ${error.message}\nURL: ${error.config?.url}`);
    }
    
    return Promise.reject(error);
  }
);

// Funciones para tu app
export const testBackend = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error(`Backend no disponible: ${error.message}`);
  }
};

export const getDirigentes = async () => {
  try {
    const response = await api.get('/api/dirigentes');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo dirigentes:', error);
    throw error;
  }
};

export const getCodigoDiario = async () => {
  try {
    const response = await api.get('/api/codigo/diario');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo código:', error);
    throw error;
  }
};

export const validarCodigo = async (codigo) => {
  try {
    const response = await api.post('/api/codigo/validar', { codigo });
    return response.data;
  } catch (error) {
    console.error('Error validando código:', error);
    throw error;
  }
};

export const registrarAsistencia = async (usuarioDirigente, codigo) => {
  try {
    const response = await api.post('/api/asistencia/registrar', {
      usuario_dirigente: usuarioDirigente,
      codigo: codigo,
      metodo: 'codigo_diario',
      dispositivo: 'expo_app'
    });
    return response.data;
  } catch (error) {
    console.error('Error registrando asistencia:', error.response?.data || error.message);
    throw error;
  }
};

export default api;