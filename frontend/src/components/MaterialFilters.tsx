import React from 'react';
import { MaterialFiltersForm } from '../types/api';
import './MaterialFilters.css';

interface MaterialFiltersProps {
  filters: MaterialFiltersForm;
  onFiltersChange: (filters: MaterialFiltersForm) => void;
  onSearch: () => void;
  onReset: () => void;
  loading: boolean;
}

const MaterialFilters: React.FC<MaterialFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  loading
}) => {
  const handleInputChange = (field: keyof MaterialFiltersForm, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="filters-panel">
      <form onSubmit={handleSubmit} className="filters-form">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Название</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Поиск по названию"
              value={filters.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Материал</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Тип материала"
              value={filters.material}
              onChange={(e) => handleInputChange('material', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Толщина от (мм)</label>
            <input
              type="number"
              className="filter-input"
              placeholder="Минимум"
              value={filters.thicknessMin}
              onChange={(e) => handleInputChange('thicknessMin', e.target.value)}
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
              onChange={(e) => handleInputChange('thicknessMax', e.target.value)}
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
              onChange={(e) => handleInputChange('densityMin', e.target.value)}
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
              onChange={(e) => handleInputChange('densityMax', e.target.value)}
              min="0"
              step="0.1"
            />
          </div>
        </div>
        
        <div className="filter-buttons">
          <button 
            type="button" 
            className="btn" 
            onClick={onReset}
            disabled={loading}
          >
            Сбросить
          </button>
          <button 
            type="submit" 
            className="btn primary" 
            disabled={loading}
          >
            {loading ? 'Поиск...' : 'Найти'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaterialFilters;
