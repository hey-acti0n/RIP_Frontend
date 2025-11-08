import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Material, MaterialFilters, MaterialFiltersForm, PaginationResponse } from '../types/api';
import { apiService } from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';
import MaterialCard from '../components/MaterialCard';
import './MaterialsPage.css';

const MaterialsPage: React.FC = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0
  });
  
  const [filters, setFilters] = useState<MaterialFiltersForm>({
    name: '',
    material: '',
    thicknessMin: '',
    thicknessMax: '',
    densityMin: '',
    densityMax: ''
  });

  const loadMaterials = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiFilters: MaterialFilters = {
        name: filters.name || undefined,
        material: filters.material || undefined,
        thickness_min: filters.thicknessMin ? parseFloat(filters.thicknessMin) : undefined,
        thickness_max: filters.thicknessMax ? parseFloat(filters.thicknessMax) : undefined,
        density_min: filters.densityMin ? parseFloat(filters.densityMin) : undefined,
        density_max: filters.densityMax ? parseFloat(filters.densityMax) : undefined,
        page,
        limit: 10
      };

      const response: PaginationResponse<Material> = await apiService.getMaterials(apiFilters);
      setMaterials(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Ошибка загрузки материалов');
      console.error('Error loading materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleFiltersChange = (newFilters: MaterialFiltersForm) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    loadMaterials(1);
  };

  const handleReset = () => {
    const resetFilters: MaterialFiltersForm = {
      name: '',
      material: '',
      thicknessMin: '',
      thicknessMax: '',
      densityMin: '',
      densityMax: ''
    };
    setFilters(resetFilters);
    loadMaterials(1);
  };

  const handleViewDetails = (id: number) => {
    navigate(`/materials/${id}`);
  };

  const handleAddToCart = (id: number) => {
    console.log('Add to cart:', id);
    // TODO: Implement add to cart functionality
  };

  const handlePageChange = (page: number) => {
    loadMaterials(page);
  };

  return (
    <div className="gradient-bg">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Материалы' }]} />
        
        {/* Расширенные фильтры */}
        <div className="filters-panel">
          <h3 style={{ color: 'white', marginBottom: '20px' }}>Фильтры поиска</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Название</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Поиск по названию"
                value={filters.name}
                onChange={(e) => handleFiltersChange({...filters, name: e.target.value})}
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Тип материала</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Резина, пробка, стекловолокно..."
                value={filters.material}
                onChange={(e) => handleFiltersChange({...filters, material: e.target.value})}
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Толщина от (мм)</label>
              <input
                type="number"
                className="filter-input"
                placeholder="Минимум"
                value={filters.thicknessMin}
                onChange={(e) => handleFiltersChange({...filters, thicknessMin: e.target.value})}
                min="0"
                step="0.1"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Толщина до (мм)</label>
              <input
                type="number"
                className="filter-input"
                placeholder="Максимум"
                value={filters.thicknessMax}
                onChange={(e) => handleFiltersChange({...filters, thicknessMax: e.target.value})}
                min="0"
                step="0.1"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Плотность от (г/см³)</label>
              <input
                type="number"
                className="filter-input"
                placeholder="Минимум"
                value={filters.densityMin}
                onChange={(e) => handleFiltersChange({...filters, densityMin: e.target.value})}
                min="0"
                step="0.1"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Плотность до (г/см³)</label>
              <input
                type="number"
                className="filter-input"
                placeholder="Максимум"
                value={filters.densityMax}
                onChange={(e) => handleFiltersChange({...filters, densityMax: e.target.value})}
                min="0"
                step="0.1"
              />
            </div>
          </div>
          
          <div className="filter-buttons">
            <button 
              className="btn" 
              onClick={handleReset}
              disabled={loading}
            >
              Сбросить
            </button>
            <button 
              className="btn primary" 
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? 'Поиск...' : 'Найти материалы'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {loading && (
          <div className="loading">
            Загрузка материалов...
          </div>
        )}

        {!loading && !error && materials.length === 0 && (
          <div className="empty-state">
            <h3>Материалы не найдены</h3>
            <p>Попробуйте изменить параметры поиска или сбросить фильтры</p>
          </div>
        )}

        {!loading && !error && materials.length > 0 && (
          <>
            <div className="materials-grid">
              {materials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onViewDetails={handleViewDetails}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {pagination.total_pages > 1 && (
              <div className="pagination">
                <button
                  className="btn"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  ← Назад
                </button>
                <span className="pagination-info">
                  Страница {pagination.page} из {pagination.total_pages} 
                  (всего материалов: {pagination.total})
                </span>
                <button
                  className="btn"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                >
                  Вперед →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MaterialsPage;