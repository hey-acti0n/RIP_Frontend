// Типы для API материалов
import type { Material, MaterialFilters, Pagination, PaginationResponse } from '../types/api';

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

const API_BASE_URL = '/api/v1';
const USE_MOCK_DATA = false; // Флаг для принудительного использования mock данных

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Проверка доступности API
  private async checkApiAvailable(): Promise<boolean> {
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
        console.log('Using mock materials data');
        const filtered = filterMockMaterials({
          name: filters.name,
          material: filters.material,
          thickness_min: filters.thickness_min,
          thickness_max: filters.thickness_max,
          density_min: filters.density_min,
          density_max: filters.density_max
        });
        return createMockPaginationResponse(
          filtered,
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
      return createMockPaginationResponse(
        filtered,
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
        console.log('Using mock material data for id:', id);
        const mockMaterial = getMockMaterial(id);
        if (mockMaterial) {
          return mockMaterial;
        }
        throw new Error('Material not found');
      }

      return await this.request<Material>(`/materials/${id}`);
    } catch (error) {
      console.error('API request failed, falling back to mock data:', error);
      
      // Fallback на mock данные
      const mockMaterial = getMockMaterial(id);
      if (mockMaterial) {
        return mockMaterial;
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