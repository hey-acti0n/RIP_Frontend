import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './TopNavbar.css';

const TopNavbar: React.FC = () => {
  const location = useLocation();
  
  // Определяем активную ссылку
  const isMaterialsActive = location.pathname === '/' || location.pathname.startsWith('/materials');
  const isCalcActive = location.pathname === '/cart';

  return (
    <nav className="top-navbar">
      <div className="navbar-container">
        <Link 
          to="/" 
          className={`nav-link ${isMaterialsActive ? 'active' : ''}`}
        >
          Каталог материалов
        </Link>
        <Link 
          to="/cart" 
          className={`nav-link ${isCalcActive ? 'active' : ''}`}
        >
          Расчёт
        </Link>
      </div>
    </nav>
  );
};

export default TopNavbar;
