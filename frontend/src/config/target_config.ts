// Конфигурация для переключения между обычным режимом и Tauri
// Установите target_tauri в true для сборки Tauri приложения
// Для GitHub Pages установите false перед деплоем
const target_tauri = true

// Использовать HTTPS (true) или HTTP (false)
// Для Tauri: автоматически определится при первом запросе
// Для разработки обычно используется HTTP, для production - HTTPS
const use_https = false

// IP адрес сервера в локальной сети (замените на ваш IP)
// Для localhost используйте "localhost", для сетевого доступа - IP адрес
const api_host = "localhost"
const img_host = "localhost"

// Порт для API и MinIO
const api_port = 8080
const img_port = 9000

// Формируем адреса с учетом протокола
// Для Tauri: используем HTTP по умолчанию (избегаем проблем с самоподписанными сертификатами)
// Для обычного режима: используем настройку use_https
const protocol = (target_tauri) ? "http" : (use_https ? "https" : "http")
export const api_proxy_addr = `${protocol}://${api_host}:${api_port}`
export const img_proxy_addr = `${protocol}://${img_host}:${img_port}`

// Адреса для API запросов
export const dest_api = (target_tauri) ? api_proxy_addr : "/api"
// MinIO всегда работает по HTTP, независимо от настроек
export const dest_img = (target_tauri) ? `http://${img_host}:${img_port}` : "http://localhost:9000"

// Функция для получения базового пути к статическим файлам
// Для Tauri в dev режиме используем dev сервер, в production - относительный путь
const getDestRootForTauri = () => {
  if (typeof window === 'undefined') return "";
  // В dev режиме Tauri использует dev сервер на localhost:3000
  // В production Tauri использует локальные файлы, поэтому путь должен быть относительным
  if (window.location.protocol === 'tauri:') {
    // Это production Tauri приложение
    return "";
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Это dev режим
    return "http://localhost:3000";
  }
  return "";
};

export const dest_root = (target_tauri) ? getDestRootForTauri() : "/RIP_Frontend"

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
