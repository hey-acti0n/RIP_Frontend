import axios from 'axios';
import { dest_api } from '../config/target_config';

// Формируем базовый URL для API
// Если dest_api начинается с http - это прямой адрес (для Tauri), добавляем /api/v1
// Если dest_api это "/api" - используем его напрямую и добавляем /v1
const API_BASE_URL = dest_api.startsWith('http') 
  ? `${dest_api}/api/v1` 
  : dest_api === '/api'
  ? '/api/v1'
  : `${dest_api}/v1`;

// Настраиваем axios
if (!axios.defaults.baseURL) {
  axios.defaults.baseURL = API_BASE_URL;
}

// Добавляем токен из localStorage при инициализации
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Interceptor для добавления токена к каждому запросу
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок авторизации
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек или недействителен
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      // Можно перенаправить на страницу входа
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;

