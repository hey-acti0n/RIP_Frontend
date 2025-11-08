// Типы для API материалов
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

// Типы для навигации
export interface BreadcrumbItem {
  label: string;
  path?: string;
}

// Типы для фильтров на фронтенде
export interface MaterialFiltersForm {
  name: string;
  material: string;
  thicknessMin: string;
  thicknessMax: string;
  densityMin: string;
  densityMax: string;
}
