import React from 'react';
import Breadcrumbs from '../components/Breadcrumbs';

const SimpleMaterialsPage: React.FC = () => {
  return (
    <div className="gradient-bg">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Материалы' }]} />
        
        <div className="panel">
          <h1 style={{ color: 'white', marginBottom: '20px' }}>
            Каталог материалов
          </h1>
          <p style={{ color: 'white' }}>
            Здесь будет список материалов с фильтрами
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleMaterialsPage;
