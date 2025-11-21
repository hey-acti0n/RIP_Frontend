// Типы для API материалов
import type { Material, MaterialFilters, PaginationResponse } from '../types/api';

// Типы для расчетов
interface Calculation {
  id: number;
  status: string;
  title: string;
  description: string;
  creator_id: number;
  created_at: string;
  formed_at?: string;
  completed_at?: string;
  total_cost?: number;
  delivery_date?: string;
}

interface MaterialCalculation {
  calculation_id: number;
  material_id: number;
  quantity: number;
  sort_order: number;
  is_main: boolean;
  comment: string;
  result_freq?: number;
  result_percent?: number;
  created_at: string;
  material: Material;
}

interface FormCalculationRequest {
  installation_weight: number;
  natural_frequency: number;
}

interface FormCalculationResponse {
  calculation_id: number;
  status: string;
  installation_weight: number;
  natural_frequency: number;
  calculation_results: MaterialCalculationResult[];
  message: string;
}

interface MaterialCalculationResult {
  material_id: number;
  material_name: string;
  quantity: number;
  result_freq: number;
  result_percent: number;
  unit_cost: number;
  total_cost: number;
}

import { filterMockMaterials, getMockMaterial, createMockPaginationResponse } from '../data/mockData';
import { dest_api } from '../config/target_config';

// Формируем базовый URL для API
// Если dest_api содержит полный URL (для Tauri), добавляем /api/v1
// Если dest_api это путь (для dev), используем его напрямую
const API_BASE_URL = dest_api.startsWith('http') 
  ? `${dest_api}/api/v1` 
  : (dest_api.endsWith('/api') ? '/api/v1' : `${dest_api}/v1`);
// Для GitHub Pages используем mock данные, так как бэкенд недоступен
const USE_MOCK_DATA = !dest_api.startsWith('http'); // Используем mock если не полный URL (не Tauri)

// Логирование для отладки
console.log('API Configuration:', { dest_api, API_BASE_URL, USE_MOCK_DATA });

class ApiService {
  // Кэш для определения протокола (HTTPS или HTTP)
  private protocolCache: 'https' | 'http' | null = null;

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Для Tauri: автоматически определяем протокол
    let baseUrl = API_BASE_URL;
    
    // Если это Tauri (полный URL) и протокол еще не определен
    if (dest_api.startsWith('http') && this.protocolCache === null) {
      // Пробуем сначала HTTP (так как HTTPS с самоподписанным сертификатом вызывает проблемы)
      try {
        const testUrl = `${baseUrl}/materials?limit=1`;
        const testResponse = await fetch(testUrl, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        if (testResponse.ok) {
          this.protocolCache = 'http';
          console.log('✓ Using HTTP for API');
        } else {
          // Если HTTP не работает, пробуем HTTPS
          const httpsBaseUrl = baseUrl.replace('http://', 'https://');
          try {
            const httpsTestUrl = `${httpsBaseUrl}/materials?limit=1`;
            const httpsTestResponse = await fetch(httpsTestUrl, { 
              method: 'GET',
              signal: AbortSignal.timeout(3000)
            });
            if (httpsTestResponse.ok) {
              this.protocolCache = 'https';
              baseUrl = httpsBaseUrl;
              console.log('✓ Using HTTPS for API');
            } else {
              this.protocolCache = 'http';
              console.log('✓ Using HTTP for API (HTTPS returned error)');
            }
          } catch (httpsError) {
            this.protocolCache = 'http';
            console.log('✓ Using HTTP for API (HTTPS certificate error)');
          }
        }
      } catch (error) {
        // HTTP не работает, пробуем HTTPS
        const httpsBaseUrl = baseUrl.replace('http://', 'https://');
        try {
          const httpsTestUrl = `${httpsBaseUrl}/materials?limit=1`;
          const httpsTestResponse = await fetch(httpsTestUrl, { 
            method: 'GET',
            signal: AbortSignal.timeout(3000)
          });
          if (httpsTestResponse.ok) {
            this.protocolCache = 'https';
            baseUrl = httpsBaseUrl;
            console.log('✓ Using HTTPS for API');
          } else {
            this.protocolCache = 'http';
            console.log('✓ Using HTTP for API (fallback)');
          }
        } catch (httpsError) {
          this.protocolCache = 'http';
          console.log('✓ Using HTTP for API (HTTPS certificate error)');
        }
      }
    } else if (this.protocolCache === 'https' && baseUrl.startsWith('http://')) {
      // Если уже определили HTTPS, используем его
      baseUrl = baseUrl.replace('http://', 'https://');
    }
    
    const url = `${baseUrl}${endpoint}`;
    console.log('API Request:', url);
    
    try {
      const fetchOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      };
      
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Если ошибка и это был HTTPS, пробуем HTTP один раз
      if (url.startsWith('https://') && this.protocolCache !== 'http') {
        console.log('HTTPS failed (certificate error), retrying with HTTP');
        this.protocolCache = 'http';
        const httpUrl = url.replace('https://', 'http://');
        const fetchOptions: RequestInit = {
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          ...options,
        };
        try {
          const response = await fetch(httpUrl, fetchOptions);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
        } catch (httpError) {
          console.error('HTTP also failed:', httpError);
          throw httpError;
        }
      }
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Проверка доступности API (не используется, но оставлено для будущего использования)
  // @ts-ignore
  private async _checkApiAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 секунды таймаут
      
      await fetch(`${API_BASE_URL}/materials?limit=1`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.warn('API unavailable, using mock data');
      return false;
    }
  }

  // Получение списка материалов с фильтрацией
  async getMaterials(filters: MaterialFilters = {}): Promise<PaginationResponse<Material>> {
    try {
      // Принудительное использование mock данных
      if (USE_MOCK_DATA) {
        const filtered = filterMockMaterials({
          name: filters.name,
          material: filters.material,
          thickness_min: filters.thickness_min,
          thickness_max: filters.thickness_max,
          density_min: filters.density_min,
          density_max: filters.density_max
        });
        
        // Используем логотип для всех mock материалов
        const mockDataWithLogo = filtered.map(material => ({
          ...material,
          image_url: '/logo.png'
        }));
        
        return createMockPaginationResponse(
          mockDataWithLogo,
          filters.page || 1,
          filters.limit || 10
        );
      }

      const queryParams = new URLSearchParams();
      
      if (filters.name) queryParams.append('name', filters.name);
      if (filters.material) queryParams.append('material', filters.material);
      if (filters.thickness_min !== undefined) queryParams.append('thickness_min', filters.thickness_min.toString());
      if (filters.thickness_max !== undefined) queryParams.append('thickness_max', filters.thickness_max.toString());
      if (filters.density_min !== undefined) queryParams.append('density_min', filters.density_min.toString());
      if (filters.density_max !== undefined) queryParams.append('density_max', filters.density_max.toString());
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = `/materials${queryString ? `?${queryString}` : ''}`;
      
      return await this.request<PaginationResponse<Material>>(endpoint);
    } catch (error) {
      console.error('API request failed, falling back to mock data:', error);
      
      // Fallback на mock данные
      const filtered = filterMockMaterials({
        name: filters.name,
        material: filters.material,
        thickness_min: filters.thickness_min,
        thickness_max: filters.thickness_max,
        density_min: filters.density_min,
        density_max: filters.density_max
      });
      
      // Используем логотип для всех mock материалов
      const mockDataWithLogo = filtered.map(material => ({
        ...material,
        image_url: '/logo.png'
      }));
      
      return createMockPaginationResponse(
        mockDataWithLogo,
        filters.page || 1,
        filters.limit || 10
      );
    }
  }

  // Получение одного материала по ID
  async getMaterial(id: number): Promise<Material> {
    try {
      // Принудительное использование mock данных
      if (USE_MOCK_DATA) {
        const mockMaterial = getMockMaterial(id);
        if (mockMaterial) {
          return {
            ...mockMaterial,
            image_url: '/logo.png' // Используем логотип для mock материала
          };
        }
        throw new Error('Material not found');
      }

      return await this.request<Material>(`/materials/${id}`);
    } catch (error) {
      console.error('API request failed, falling back to mock data:', error);
      
      // Fallback на mock данные
      const mockMaterial = getMockMaterial(id);
      if (mockMaterial) {
        return {
          ...mockMaterial,
          image_url: '/logo.png' // Используем логотип для mock материала
        };
      }
      throw error;
    }
  }

  // Создание нового расчета
  async createCalculation(): Promise<Calculation> {
    try {
      return await this.request<Calculation>('/calculations', {
        method: 'POST',
      });
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Получение информации о корзине
  async getCartInfo(): Promise<{ calculation_id: number; item_count: number }> {
    try {
      return await this.request<{ calculation_id: number; item_count: number }>('/calculations/cart-info');
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Получение материалов расчета
  async getCalculationMaterials(calculationId: number): Promise<MaterialCalculation[]> {
    try {
      return await this.request<MaterialCalculation[]>(`/calculations/${calculationId}/materials`);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Добавление материала в корзину
  async addMaterialToCart(materialId: number, quantity: number = 1): Promise<{ calculation_id: number; message: string }> {
    try {
      return await this.request<{ calculation_id: number; message: string }>(`/materials/${materialId}/add-to-cart`, {
        method: 'POST',
        body: JSON.stringify({ quantity }),
      });
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Удаление материала из расчета
  async removeMaterialFromCalculation(calculationId: number, materialId: number): Promise<void> {
    try {
      await this.request(`/calculations/${calculationId}/materials/${materialId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Обновление материала в расчете
  async updateMaterialInCalculation(calculationId: number, materialId: number, updates: {
    quantity?: number;
    comment?: string;
    sort_order?: number;
    is_main?: boolean;
  }): Promise<void> {
    try {
      await this.request(`/calculations/${calculationId}/materials/${materialId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Формирование расчета (выполнение расчетов)
  async formCalculation(calculationId: number, data: FormCalculationRequest): Promise<FormCalculationResponse> {
    try {
      return await this.request<FormCalculationResponse>(`/calculations/${calculationId}/form`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Завершение расчета
  async completeCalculation(calculationId: number): Promise<void> {
    try {
      await this.request(`/calculations/${calculationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' }),
      });
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Удаление расчета
  async deleteCalculation(calculationId: number): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>(`/calculations/${calculationId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();