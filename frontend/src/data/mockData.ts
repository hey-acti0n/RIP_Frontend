import type { Material } from '../types/api';

/**
 * Mock данные для демонстрации при недоступности API
 */

const DEFAULT_IMAGE_URL = '/logo.png';

export const mockMaterials: Material[] = [
  {
    id: 1,
    name: 'Пробковый виброизолятор CORK-8',
    description: 'Экологически чистый материал из натуральной пробки. Обладает отличными звукоизоляционными и виброизоляционными свойствами. Подходит для использования в жилых и общественных помещениях.',
    image_url: DEFAULT_IMAGE_URL,
    is_active: true,
    density: 240,
    thickness: 8,
    material: 'Пробка',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Стекловолокно ARP-200',
    description: 'Прочный виброизоляционный материал на основе стекловолокна. Высокая устойчивость к агрессивным средам и экстремальным температурам. Рекомендуется для промышленного оборудования.',
    image_url: DEFAULT_IMAGE_URL,
    is_active: true,
    density: 2500,
    thickness: 20,
    material: 'Стекловолокно',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Стекловолокно Fiberglass',
    description: 'Теплоизоляционный материал из стекловолокна с отличными виброизоляционными свойствами. Используется для изоляции промышленного оборудования и систем отопления.',
    image_url: DEFAULT_IMAGE_URL,
    is_active: true,
    density: 2000,
    thickness: 15,
    material: 'Стекловолокно',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Полиуретановая виброизоляция PU-450',
    description: 'Современный полимерный материал с отличными демпфирующими свойствами. Широкий диапазон рабочих температур от -40°C до +120°C. Идеально подходит для компрессоров и насосного оборудования.',
    image_url: DEFAULT_IMAGE_URL,
    is_active: true,
    density: 1200,
    thickness: 15,
    material: 'Полиуретан',
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    name: 'Виброфоам N-300',
    description: 'Легкий и универсальный виброизоляционный материал на основе вспененного полиэтилена. Простота установки и эффективная защита от вибраций. Подходит для бытовой техники.',
    image_url: DEFAULT_IMAGE_URL,
    is_active: true,
    density: 300,
    thickness: 5,
    material: 'Вспененный полиэтилен',
    created_at: new Date().toISOString()
  }
];

/**
 * Фильтрация mock данных по параметрам
 */
export function filterMockMaterials(filters: {
  name?: string;
  material?: string;
  thickness_min?: number;
  thickness_max?: number;
  density_min?: number;
  density_max?: number;
}): Material[] {
  let filtered = [...mockMaterials];

  // Фильтр по названию
  if (filters.name) {
    const nameLower = filters.name.toLowerCase();
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(nameLower)
    );
  }

  // Фильтр по типу материала
  if (filters.material) {
    const materialLower = filters.material.toLowerCase();
    filtered = filtered.filter(m => 
      m.material?.toLowerCase().includes(materialLower)
    );
  }

  // Фильтр по минимальной толщине
  if (filters.thickness_min !== undefined) {
    filtered = filtered.filter(m => 
      m.thickness !== undefined && m.thickness >= filters.thickness_min!
    );
  }

  // Фильтр по максимальной толщине
  if (filters.thickness_max !== undefined) {
    filtered = filtered.filter(m => 
      m.thickness !== undefined && m.thickness <= filters.thickness_max!
    );
  }

  // Фильтр по минимальной плотности
  if (filters.density_min !== undefined) {
    filtered = filtered.filter(m => 
      m.density !== undefined && m.density >= filters.density_min!
    );
  }

  // Фильтр по максимальной плотности
  if (filters.density_max !== undefined) {
    filtered = filtered.filter(m => 
      m.density !== undefined && m.density <= filters.density_max!
    );
  }

  return filtered;
}

/**
 * Получить mock материал по ID
 */
export function getMockMaterial(id: number): Material | undefined {
  return mockMaterials.find(m => m.id === id);
}

/**
 * Создать пагинацию для mock данных
 */
export function createMockPaginationResponse(
  data: Material[],
  page: number = 1,
  limit: number = 10
) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: data.length,
      total_pages: Math.ceil(data.length / limit)
    }
  };
}
