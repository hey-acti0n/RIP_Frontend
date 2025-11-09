// Конфигурация для переключения между обычным режимом и Tauri
// Установите target_tauri в true для сборки Tauri приложения
const target_tauri = true

// IP адрес сервера в локальной сети (замените на ваш IP)
export const api_proxy_addr = "http://192.168.1.225:8080"
export const img_proxy_addr = "http://192.168.1.225:9000"

// Адреса для API запросов
export const dest_api = (target_tauri) ? api_proxy_addr : "/api"
export const dest_img = (target_tauri) ? img_proxy_addr : "http://localhost:9000"
export const dest_root = (target_tauri) ? "" : "/RIP_Frontend"

