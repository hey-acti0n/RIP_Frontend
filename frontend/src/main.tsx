import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from "react-redux"
import { registerSW } from "virtual:pwa-register"
import './index.css'
import App from './App.tsx'
import store from "./store/store"
import { getProfileAsync } from "./store/slices/userSlice"
import './api/axiosConfig'

// Загружаем профиль пользователя при наличии токена
const token = localStorage.getItem('token');
if (token) {
  store.dispatch(getProfileAsync());
}

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
