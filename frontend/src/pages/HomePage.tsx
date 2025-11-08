import React from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="gradient-bg">
      <div className="container">
        <Breadcrumbs items={[]} />
        
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">UltraRezina</h1>
            <p className="hero-subtitle">
              Профессиональные решения для виброизоляции и звукоизоляции
            </p>
            <p className="hero-description">
              Мы предлагаем широкий ассортимент высококачественных материалов 
              для виброизоляции, включая резину, пробку, стекловолокно и другие 
              специализированные материалы. Наши решения помогут создать 
              комфортную и тихую среду в любом помещении.
            </p>
            <div className="hero-actions">
              <Link to="/materials" className="btn primary">
                Посмотреть материалы
              </Link>
            </div>
          </div>
          
          <div className="hero-features">
            <div className="feature-card">
              <h3>Высокое качество</h3>
              <p>Все материалы проходят строгий контроль качества</p>
            </div>
            <div className="feature-card">
              <h3>Профессиональные решения</h3>
              <p>Индивидуальный подход к каждому проекту</p>
            </div>
            <div className="feature-card">
              <h3>Быстрая доставка</h3>
              <p>Доставляем материалы в кратчайшие сроки</p>
            </div>
          </div>
        </div>
        
        <div className="info-section">
          <div className="info-panel">
            <h2>О нашей компании</h2>
            <p>
              UltraRezina — ведущий поставщик материалов для виброизоляции 
              и звукоизоляции. Наша компания работает на рынке более 10 лет 
              и зарекомендовала себя как надежный партнер для строительных 
              компаний, архитекторов и частных клиентов.
            </p>
            <p>
              Мы специализируемся на поставке резинотехнических изделий, 
              пробковых материалов, стекловолокна и других специализированных 
              материалов для создания эффективной виброизоляции.
            </p>
          </div>
          
          <div className="info-panel">
            <h2>Наши услуги</h2>
            <ul className="services-list">
              <li>Консультации по выбору материалов</li>
              <li>Расчет необходимого количества материалов</li>
              <li>Доставка по всей России</li>
              <li>Техническая поддержка</li>
              <li>Гарантия на все материалы</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
