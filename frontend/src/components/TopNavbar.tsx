import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';
import type { AppDispatch, RootState } from '../store/types';
import { logoutUserAsync } from '../store/slices/userSlice';
import { clearCurrentCalculation } from '../store/slices/calculationsSlice';
import { resetFiltersAction } from '../store/slices/filtersSlice';
import './TopNavbar.css';

const TopNavbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, username, fullName } = useSelector((state: RootState) => state.user);
  
  // Определяем активную ссылку
  const isMaterialsActive = location.pathname === '/materials' || location.pathname.startsWith('/materials/');
  const isCalcActive = location.pathname === '/cart';
  const isCalculationsActive = location.pathname.startsWith('/calculations') && !location.pathname.match(/^\/calculations\/\d+$/);
  const isProfileActive = location.pathname === '/profile';

  const handleLogout = async () => {
    await dispatch(logoutUserAsync());
    // Сбрасываем фильтры и содержимое конструктора заявки
    dispatch(resetFiltersAction());
    dispatch(clearCurrentCalculation());
    navigate('/');
  };

  return (
    <nav className="top-navbar">
      <div className="navbar-container">
        <Link 
          to="/materials" 
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
        {isAuthenticated && (
          <>
            <Link 
              to="/calculations" 
              className={`nav-link ${isCalculationsActive ? 'active' : ''}`}
            >
              Мои рассчёты
            </Link>
            <Link 
              to="/profile" 
              className={`nav-link ${isProfileActive ? 'active' : ''}`}
            >
              {fullName || username}
            </Link>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Выйти
            </Button>
          </>
        )}
        {!isAuthenticated && (
          <Link to="/login" className="nav-link">
            Войти
          </Link>
        )}
      </div>
    </nav>
  );
};

export default TopNavbar;
