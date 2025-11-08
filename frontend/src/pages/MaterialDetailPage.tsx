import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Material } from '../types/api';
import { apiService } from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';
import './MaterialDetailPage.css';

const MaterialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMaterial = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const materialId = parseInt(id, 10);
        const materialData = await apiService.getMaterial(materialId);
        setMaterial(materialData);
      } catch (err) {
        setError('Материал не найден');
        console.error('Error loading material:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMaterial();
  }, [id]);

  const handleBack = () => {
    navigate('/materials');
  };

  const handleAddToCart = () => {
    if (material) {
      // TODO: Implement add to cart functionality
      console.log('Add to cart:', material.id);
    }
  };

  if (loading) {
    return (
      <div className="gradient-bg">
        <div className="container">
          <Breadcrumbs items={[
            { label: 'Материалы', path: '/materials' },
            { label: 'Загрузка...' }
          ]} />
          <div className="loading">
            Загрузка материала...
          </div>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="gradient-bg">
        <div className="container">
          <Breadcrumbs items={[
            { label: 'Материалы', path: '/materials' },
            { label: 'Ошибка' }
          ]} />
          <div className="error">
            {error || 'Материал не найден'}
          </div>
          <button className="btn" onClick={handleBack}>
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  const defaultImage = '/logo.png';
  const formatProps = () => {
    const props = [];
    if (material.density) props.push(`Плотность: ${material.density} г/см³`);
    if (material.thickness) props.push(`Толщина: ${material.thickness} мм`);
    if (material.material) props.push(`Тип материала: ${material.material}`);
    if (material.is_active !== undefined) props.push(`Статус: ${material.is_active ? 'Активен' : 'Неактивен'}`);
    return props;
  };

  return (
    <div className="gradient-bg">
      <div className="container">
        <Breadcrumbs items={[
          { label: 'Материалы', path: '/materials' },
          { label: material.name }
        ]} />
        
        <button className="btn back-button" onClick={handleBack}>
          ← Назад к списку
        </button>
        
        <div className="panel detail-panel">
          <div className="detail-grid">
            <div className="detail-info">
              <h1 className="detail-title">{material.name}</h1>
              
              <div className="detail-section">
                <h3 className="detail-section-title">Характеристики</h3>
                <ul className="detail-props">
                  {formatProps().map((prop, index) => (
                    <li key={index}>{prop}</li>
                  ))}
                </ul>
              </div>
              
              <div className="detail-section">
                <h3 className="detail-section-title">Описание</h3>
                <p className="detail-description">
                  {material.description || 'Описание не указано'}
                </p>
              </div>
              
              <div className="detail-actions">
                <button className="btn primary" onClick={handleAddToCart}>
                  Добавить в корзину
                </button>
              </div>
            </div>
            
            <div className="detail-image-container">
              <img
                className="detail-image"
                src={material.image_url || defaultImage}
                alt={material.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = defaultImage;
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetailPage;
