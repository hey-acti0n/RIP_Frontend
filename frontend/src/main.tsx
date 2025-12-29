import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from "react-redux"
import { registerSW } from "virtual:pwa-register"
import './index.css'
import App from './App.tsx'
import store from "./store/store"
import { getProfileAsync, logout } from "./store/slices/userSlice"
import { setupAxiosInterceptors } from './api/axiosConfig'

// Проверяем, было ли обновление страницы (F5)
// Используем комбинацию sessionStorage и Performance API
const navigationType = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
const isPageReload = navigationType?.type === 'reload' || sessionStorage.getItem('page_reload') === 'true';

if (isPageReload) {
  // Это обновление страницы (F5) - выходим из аккаунта, но токен оставляем в localStorage
  sessionStorage.removeItem('page_reload');
  sessionStorage.removeItem('session_active');
  store.dispatch(logout());
} else {
  // Это первая загрузка или новая вкладка - устанавливаем флаг для следующего обновления
  sessionStorage.setItem('page_reload', 'true');
  
  // Обработчик события beforeunload для установки флага при обновлении страницы
  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('page_reload', 'true');
  });
}

// Настраиваем axios interceptor после создания store
setupAxiosInterceptors(store);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  // Регистрируем service worker только в production
  registerSW()
}
