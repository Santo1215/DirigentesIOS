export const API_URL = 'https://mydiri.up.railway.app';

const request = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Error en la petición');
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetch:', error.message);
    throw error;
  }
};

// ====== FUNCIONES DE TU APP ======

export const testBackend = () => {
  return request('/');
};

export const login = (usuario, password) => {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, password }),
  });
};

export const getDirigentes = () => {
  return request('/api/dirigentes');
};

export const getCodigoDiario = () => {
  return request('/api/codigo/diario');
};

export const validarCodigo = (codigo) => {
  return request('/api/codigo/validar', {
    method: 'POST',
    body: JSON.stringify({ codigo }),
  });
};

export const registrarAsistencia = (usuarioDirigente, codigo) => {
  return request('/api/asistencia/registrar', {
    method: 'POST',
    body: JSON.stringify({
      usuario_dirigente: usuarioDirigente,
      codigo,
      metodo: 'codigo_diario',
      dispositivo: 'expo_app',
    }),
  });
};
