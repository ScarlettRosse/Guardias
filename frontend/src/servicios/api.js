import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000'
});

// Interceptor para agregar headers automáticamente
API.interceptors.request.use(
  (config) => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (usuario.id) {
      config.headers['usuario-id'] = usuario.id;
      config.headers['rol'] = usuario.rol;
    }
    console.log('🔍 DEBUG Frontend - Headers enviados:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
