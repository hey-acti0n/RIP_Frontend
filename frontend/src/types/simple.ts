// Простые типы для API
export interface Material {
  id: number;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
  density?: number;
  thickness?: number;
  material?: string;
  created_at: string;
  props?: string[];
}

export interface MaterialFilters {
  name?: string;
  material?: string;
  thickness_min?: number;
  thickness_max?: number;
  density_min?: number;
  density_max?: number;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: Pagination;
}
