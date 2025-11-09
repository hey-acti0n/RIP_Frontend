// Конфигурация для переключения между обычным режимом и Tauri
// Установите target_tauri в true для сборки Tauri приложения
// Для GitHub Pages установите false перед деплоем
const target_tauri = true

// Использовать HTTPS (true) или HTTP (false)
// Для разработки обычно используется HTTP, для production - HTTPS
const use_https = false

// IP адрес сервера в локальной сети (замените на ваш IP)
const api_host = "192.168.1.227"
const img_host = "192.168.1.227"

// Порт для API и MinIO
const api_port = 8080
const img_port = 9000

// Формируем адреса с учетом протокола
const protocol = use_https ? "https" : "http"
export const api_proxy_addr = `${protocol}://${api_host}:${api_port}`
export const img_proxy_addr = `${protocol}://${img_host}:${img_port}`

// Адреса для API запросов
export const dest_api = (target_tauri) ? api_proxy_addr : "/api"
export const dest_img = (target_tauri) ? img_proxy_addr : "http://localhost:9000"
export const dest_root = (target_tauri) ? "" : "/RIP_Frontend"

// Для обратной совместимости, если путь начинается с /images/, добавляем базовый URL
export const getImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  if (imagePath.startsWith('/')) {
    // Если путь начинается с /, добавляем базовый URL MinIO
    return `${dest_img}${imagePath}`;
  }
  // Если путь без /, добавляем /images/ и базовый URL
  return `${dest_img}/images/${imagePath}`;
}
