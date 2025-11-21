import React from 'react';
import type { Material } from '../types/api';
import './MaterialCard.css';
import { getDestRoot } from '../config/target_config';

interface MaterialCardProps {
  material: Material;
  onViewDetails: (id: number) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ 
  material, 
  onViewDetails
}) => {
  const defaultImage = `${getDestRoot()}/logo.png`;
  
  const formatProps = () => {
    const props = [];
    if (material.density) props.push(`Плотность: ${material.density} г/см³`);
    if (material.thickness) props.push(`Толщина: ${material.thickness} мм`);
    if (material.material) props.push(`Материал: ${material.material}`);
    return props.slice(0, 3); // Показываем только первые 3 свойства
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>{material.name}</h3>
      </div>
      
      <div className="card-image-container">
        <img 
          src={material.image_url || defaultImage} 
          alt={material.name}
          className="material-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = defaultImage;
          }}
        />
      </div>
      
      <div className="card-footer">
        <div className="card-actions">
          <button 
            className="btn" 
            onClick={() => onViewDetails(material.id)}
          >
            Подробнее
          </button>
        </div>
        <div className="material-props">
          {formatProps().map((prop, index) => (
            <div key={index}>{prop}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MaterialCard;
