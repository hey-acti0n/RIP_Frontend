import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useDispatch } from "react-redux";
import { invoke } from "@tauri-apps/api/core";
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';
import { apiService } from './services/api';
import Breadcrumbs from './components/Breadcrumbs';
import TopNavbar from './components/TopNavbar';
import type { Material } from './types/api';
import { useFilters, updateFilterAction, resetFiltersAction } from './store/slices/filtersSlice';
import { dest_root, dest_img, dest_api } from './config/target_config';

// Типы для компонентов

interface CartItem {
  material: Material;
  quantity: number;
}

// Контекст корзины с интеграцией БД
const CartContext = React.createContext<{
  cart: CartItem[];
  calculationId: number | null;
  addToCart: (material: Material) => Promise<void>;
  removeFromCart: (materialId: number) => Promise<void>;
  updateQuantity: (materialId: number, quantity: number) => Promise<void>;
  updateComment: (materialId: number, comment: string) => Promise<void>;
  getTotalItems: () => number;
  loadCartFromDB: () => Promise<void>;
  clearCart: () => Promise<void>;
  formCalculation: (mass: number, frequency: number) => Promise<any>;
}>({
  cart: [],
  calculationId: null,
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  updateComment: async () => {},
  getTotalItems: () => 0,
  loadCartFromDB: async () => {},
  clearCart: async () => {},
  formCalculation: async () => {},
});

// Провайдер корзины с интеграцией БД
const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [calculationId, setCalculationId] = React.useState<number | null>(null);
  const [comments, setComments] = React.useState<Record<number, string>>({});

  // Загружаем корзину из БД при инициализации
  React.useEffect(() => {
    loadCartFromDB();
  }, []);

  const loadCartFromDB = async () => {
    // Пропускаем загрузку из БД, если используется mock режим (GitHub Pages)
    if (!dest_api.startsWith('http')) {
      loadCartFromStorage();
      return;
    }
    
    try {
      // Сначала получаем информацию о корзине
      const cartInfo = await apiService.getCartInfo();
      setCalculationId(cartInfo.calculation_id);
      
      // Проверяем, есть ли активный расчет (calculation_id > 0)
      if (!cartInfo.calculation_id || cartInfo.calculation_id === 0) {
        setCart([]);
        setComments({});
        // Fallback на localStorage
        loadCartFromStorage();
        return;
      }
      
      // Затем получаем материалы расчета
      const materials = await apiService.getCalculationMaterials(cartInfo.calculation_id);
      
      // Конвертируем материалы из БД в формат корзины
      const cartItems: CartItem[] = materials.map(item => ({
        material: {
          id: item.material.id,
          name: item.material.name,
          description: item.material.description,
          image_url: item.material.image_url.startsWith('http')
            ? item.material.image_url 
            : item.material.image_url.startsWith('/')
            ? `${dest_root}${item.material.image_url}`
            : `http://localhost:9000${item.material.image_url}`,
          is_active: item.material.is_active,
          density: item.material.density,
          thickness: item.material.thickness,
          material: item.material.material,
          created_at: item.material.created_at,
          props: [
            `Плотность: ${item.material.density} кг/м³`,
            `Толщина: ${item.material.thickness} мм`,
            `Материал: ${item.material.material}`
          ]
        },
        quantity: item.quantity
      }));
      
      setCart(cartItems);
      
      // Сохраняем комментарии
      const commentsMap: Record<number, string> = {};
      materials.forEach(item => {
        if (item.comment) {
          commentsMap[item.material_id] = item.comment;
        }
      });
      setComments(commentsMap);
      
    } catch (error) {
      console.error('Error loading cart from DB:', error);
      // Fallback на localStorage
      loadCartFromStorage();
    }
  };

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('ultrarezina_cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        setCart(cartData.cart || []);
        setCalculationId(cartData.calculationId || null);
        setComments(cartData.comments || {});
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  };

  const addToCart = async (material: Material) => {
    // Пропускаем добавление в БД, если используется mock режим (GitHub Pages)
    if (!dest_api.startsWith('http')) {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.material.id === material.id);
        let newCart;
        if (existingItem) {
          newCart = prevCart.map(item =>
            item.material.id === material.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          newCart = [...prevCart, { material, quantity: 1 }];
        }
        saveCartToStorage(newCart, calculationId, comments);
        return newCart;
      });
      return;
    }
    
    try {
      // Добавляем в БД
      const result = await apiService.addMaterialToCart(material.id, 1);
      
      // Обновляем calculationId если он изменился
      if (result.calculation_id && result.calculation_id !== calculationId) {
        setCalculationId(result.calculation_id);
      }
      
      // Обновляем локальное состояние
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.material.id === material.id);
        let newCart;
        if (existingItem) {
          newCart = prevCart.map(item =>
            item.material.id === material.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          newCart = [...prevCart, { material, quantity: 1 }];
        }
        
        // Сохраняем в localStorage как backup
        saveCartToStorage(newCart, result.calculation_id || calculationId, comments);
        return newCart;
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const saveCartToStorage = (cartData: CartItem[], calcId: number | null, commentsData: Record<number, string>) => {
    try {
      localStorage.setItem('ultrarezina_cart', JSON.stringify({
        cart: cartData,
        calculationId: calcId,
        comments: commentsData
      }));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  };

  const removeFromCart = async (materialId: number) => {
    try {
      setCart(prevCart => {
        const newCart = prevCart.filter(item => item.material.id !== materialId);
        saveCartToStorage(newCart, calculationId, comments);
        return newCart;
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (materialId: number, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(materialId);
      } else {
        setCart(prevCart => {
          const newCart = prevCart.map(item =>
            item.material.id === materialId
              ? { ...item, quantity }
              : item
          );
          saveCartToStorage(newCart, calculationId, comments);
          return newCart;
        });
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const updateComment = async (materialId: number, comment: string) => {
    try {
      setComments(prev => {
        const newComments = { ...prev, [materialId]: comment };
        saveCartToStorage(cart, calculationId, newComments);
        return newComments;
      });
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const clearCart = async () => {
    try {
      // Если есть активный расчет, удаляем его из БД (только если не mock режим)
      if (calculationId && dest_api.startsWith('http')) {
        try {
          await apiService.deleteCalculation(calculationId);
        } catch (error) {
          console.warn('Failed to delete calculation from DB:', error);
        }
      }
      
      // Очищаем локальное состояние
      setCart([]);
      setComments({});
      setCalculationId(null);
      localStorage.removeItem('ultrarezina_cart');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const formCalculation = async (mass: number, frequency: number) => {
    try {
      if (cart.length === 0) {
        throw new Error('Корзина пуста');
      }
      
      // В mock режиме возвращаем заглушку
      if (!dest_api.startsWith('http')) {
        // Генерируем mock результаты расчета
        return {
          calculation_results: cart.map(item => ({
            material_id: item.material.id,
            result_freq: Math.random() * 50 + 10, // Случайная частота 10-60 Гц
            result_percent: Math.random() * 30 + 70 // Случайная изоляция 70-100%
          }))
        };
      }
      
      if (!calculationId) {
        throw new Error('Нет активного расчета');
      }
      
      // Выполняем расчет через БД
      const result = await apiService.formCalculation(calculationId, {
        installation_weight: mass,
        natural_frequency: frequency
      });
      
      return result;
    } catch (error) {
      console.error('Error forming calculation:', error);
      throw error;
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      calculationId,
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      updateComment,
      getTotalItems, 
      loadCartFromDB,
      clearCart,
      formCalculation
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Хук для использования корзины
const useCart = () => {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Главная страница в стиле оригинального каталога
const HomePage: React.FC = () => {
  const dispatch = useDispatch();
  const filters = useFilters();
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { addToCart, getTotalItems } = useCart();


  React.useEffect(() => {
    // Загружаем данные из API
    const loadMaterials = async () => {
      try {
        const apiFilters: any = {
          page: 1,
          limit: 10
        };
        
        if (filters.name) apiFilters.name = filters.name;
        if (filters.material) apiFilters.material = filters.material;
        if (filters.thicknessMin) apiFilters.thickness_min = parseFloat(filters.thicknessMin);
        if (filters.thicknessMax) apiFilters.thickness_max = parseFloat(filters.thicknessMax);
        if (filters.densityMin) apiFilters.density_min = parseFloat(filters.densityMin);
        if (filters.densityMax) apiFilters.density_max = parseFloat(filters.densityMax);
        
        const response = await apiService.getMaterials(apiFilters);
        
        // Обрабатываем URL изображений для MinIO
        // Если это логотип или путь начинается с '/', добавляем dest_root для GitHub Pages
        const materialsWithFullUrls = response.data.map((material: Material) => ({
          ...material,
          image_url: material.image_url.startsWith('http')
            ? material.image_url 
            : material.image_url.startsWith('/')
            ? `${dest_root}${material.image_url}`
            : `${dest_img}${material.image_url}`,
          props: [
            `Плотность: ${material.density} кг/м³`,
            `Толщина: ${material.thickness} мм`,
            `Материал: ${material.material}`
          ]
        }));
        
        setMaterials(materialsWithFullUrls);
      } catch (error) {
        console.error('Error loading materials:', error);
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    loadMaterials();
  }, [filters]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const apiFilters: any = {
        page: 1,
        limit: 10
      };
      
      if (filters.name) apiFilters.name = filters.name;
      if (filters.material) apiFilters.material = filters.material;
      if (filters.thicknessMin) apiFilters.thickness_min = parseFloat(filters.thicknessMin);
      if (filters.thicknessMax) apiFilters.thickness_max = parseFloat(filters.thicknessMax);
      if (filters.densityMin) apiFilters.density_min = parseFloat(filters.densityMin);
      if (filters.densityMax) apiFilters.density_max = parseFloat(filters.densityMax);
      
      const response = await apiService.getMaterials(apiFilters);
      
      // Обрабатываем URL изображений для MinIO
      // Если путь начинается с '/', добавляем dest_root для GitHub Pages
      const materialsWithFullUrls = response.data.map((material: Material) => ({
        ...material,
        image_url: material.image_url.startsWith('http')
          ? material.image_url 
          : material.image_url.startsWith('/')
          ? `${dest_root}${material.image_url}`
          : `${dest_img}${material.image_url}`,
        props: [
          `Плотность: ${material.density} кг/м³`,
          `Толщина: ${material.thickness} мм`,
          `Материал: ${material.material}`
        ]
      }));
      
      setMaterials(materialsWithFullUrls);
    } catch (error) {
      console.error('Error searching materials:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg">
      <header className="container header">
        <div className="brand">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <img
              src={`${dest_root}/logo.png`}
              alt="UltraRezina"
              style={{
                width: '510px',
                height: '80px',
                borderRadius: '8px',
                objectFit: 'contain',
                background: '#ffffff00'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `${dest_root}/logo.png`;
              }}
            />
          </Link>
        </div>
      </header>
      
      <main className="container">
        <section className="search-bar">
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <input
              className="input"
              type="search"
              placeholder="Поиск материала"
              value={filters.name}
              onChange={(e) => dispatch(updateFilterAction({ name: e.target.value }))}
              style={{ flex: 2, minWidth: '240px' }}
            />
            <input
              className="input"
              type="number"
              placeholder="Толщина от (мм)"
              value={filters.thicknessMin}
              onChange={(e) => dispatch(updateFilterAction({ thicknessMin: e.target.value }))}
              style={{ flex: 1, minWidth: '120px' }}
              min="1"
              step="0.1"
            />
            <input
              className="input"
              type="number"
              placeholder="Толщина до (мм)"
              value={filters.thicknessMax}
              onChange={(e) => dispatch(updateFilterAction({ thicknessMax: e.target.value }))}
              style={{ flex: 1, minWidth: '120px' }}
              min="1"
              step="0.1"
            />
            <button
              type="button"
              className="btn"
              onClick={() => dispatch(resetFiltersAction())}
              style={{ marginLeft: 'auto' }}
            >
              Сбросить
            </button>
            <button
              type="submit"
              className="icon-btn"
              aria-label="search"
              style={{ background: 'transparent', border: 'none', padding: 0 }}
            >
              <img
                src={`${dest_root}/search_icon.png`}
                alt="search"
                style={{ width: '40px', height: '40px', verticalAlign: 'middle' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default-material.jpg";
                }}
              />
            </button>
                    <div className="cart-container">
                      <Link
                        className="icon-btn"
                        to="/cart"
                      >
                        <img
                          src={`${dest_root}/cart_icon.png`}
                          alt="Корзина"
                          style={{ width: '40px', height: '40px', verticalAlign: 'middle' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/default-material.jpg";
                          }}
                        />
                      </Link>
                      <span className="cart-badge">{getTotalItems()}</span>
                    </div>
          </form>
        </section>

        <section id="cards" className="grid">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Загрузка...</span>
              </div>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center" style={{ color: 'white', gridColumn: '1 / -1' }}>
              <h3>Материалы не найдены</h3>
              <p>Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            materials.map((material: Material) => (
              <div key={material.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, flex: 1 }}>{material.name}</h3>
                </div>
                <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                  <img 
                    src={material.image_url} 
                    alt={material.name}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div className="actions" style={{ flex: 1 }}>
                            <Link className="btn" to={`/materials/${material.id}`}>Подробнее</Link>
                            <button 
                              className="btn primary" 
                              type="button"
                              onClick={async () => {
                                try {
                                  await addToCart(material);
                                } catch (error) {
                                  console.error('Error adding to cart:', error);
                                }
                              }}
                            >
                              Добавить
                            </button>
                          </div>
                  <div className="muted" style={{ fontSize: '11px', lineHeight: 1.3, marginLeft: '15px', maxWidth: '200px', textAlign: 'right' }}>
                    {material.props ? material.props.slice(0, 3).map((prop: string, index: number) => (
                      <span key={index}>
                        {index > 0 && <br />}
                        {prop}
                      </span>
                    )) : (
                      <>
                        {material.density && <span>Плотность: {material.density} кг/м³</span>}
                        {material.thickness && <><br />Толщина: {material.thickness} мм</>}
                        {material.material && <><br />Материал: {material.material}</>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};


// Страница детальной информации о материале в стиле оригинала
const MaterialDetailPage: React.FC = () => {
  const { id } = React.useMemo(() => {
    const pathParts = window.location.pathname.split('/');
    return { id: pathParts[pathParts.length - 1] };
  }, []);

  const [material, setMaterial] = React.useState<Material | null>(null);
  const [loading, setLoading] = React.useState(true);


  React.useEffect(() => {
    // Загружаем данные из API
    const loadMaterial = async () => {
      try {
        const materialData = await apiService.getMaterial(parseInt(id));
        
        // Обрабатываем URL изображения для MinIO
        // Если путь начинается с '/', добавляем dest_root для GitHub Pages
        const materialWithFullUrl = {
          ...materialData,
          image_url: materialData.image_url.startsWith('http')
            ? materialData.image_url 
            : materialData.image_url.startsWith('/')
            ? `${dest_root}${materialData.image_url}`
            : `http://localhost:9000${materialData.image_url}`,
          props: [
            `Плотность: ${materialData.density} кг/м³`,
            `Толщина: ${materialData.thickness} мм`,
            `Материал: ${materialData.material}`
          ]
        };
        
        setMaterial(materialWithFullUrl);
      } catch (error) {
        console.error('Error loading material:', error);
        setMaterial(null);
      } finally {
        setLoading(false);
      }
    };

    loadMaterial();
  }, [id]);

  if (loading) {
    return (
      <div className="gradient-bg">
        <header className="container header">
          <div className="brand">
            <a href="/" style={{ textDecoration: 'none' }}>
              <img
                src={`${dest_root}/logo.png`}
                alt="UltraRezina"
                style={{
                  width: '510px',
                  height: '80px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                  background: '#ffffff00'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default-material.jpg";
                }}
              />
            </a>
          </div>
        </header>
        <main className="container">
          <Breadcrumbs items={[
            { label: 'Материалы', href: '/' },
            { label: 'Загрузка...' }
          ]} />
          <div className="text-center">
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="gradient-bg">
        <header className="container header">
          <div className="brand">
            <a href="/" style={{ textDecoration: 'none' }}>
              <img
                src={`${dest_root}/logo.png`}
                alt="UltraRezina"
                style={{
                  width: '510px',
                  height: '80px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                  background: '#ffffff00'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default-material.jpg";
                }}
              />
            </a>
          </div>
        </header>
        <main className="container">
          <Breadcrumbs items={[
            { label: 'Материалы', href: '/' },
            { label: 'Материал не найден' }
          ]} />
          <div className="text-center">
            <h1 style={{ color: 'white' }}>Материал не найден</h1>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="gradient-bg">
      <header className="container header">
        <div className="brand">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <img
              src={`${dest_root}/logo.png`}
              alt="UltraRezina"
              style={{
                width: '510px',
                height: '80px',
                borderRadius: '8px',
                objectFit: 'contain',
                background: '#ffffff00'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `${dest_root}/logo.png`;
              }}
            />
          </Link>
        </div>
      </header>
      
      <main className="container">
        <Breadcrumbs items={[
          { label: 'Материалы', href: '/' },
          { label: material.name }
        ]} />
        <Link className="btn" to="/">Назад</Link>
        <section className="panel detail">
          <div className="detail-grid">
            <div>
              <h1>{material.name}</h1>
              <p className="muted">Характеристики</p>
              <ul>
                {material.props ? material.props.map((prop: string, index: number) => (
                  <li key={index}>{prop}</li>
                )) : (
                  <>
                    {material.density && <li>Плотность: {material.density} кг/м³</li>}
                    {material.thickness && <li>Толщина: {material.thickness} мм</li>}
                    {material.material && <li>Материал: {material.material}</li>}
                  </>
                )}
              </ul>
            </div>
            <div>
              <p className="muted">Описание</p>
              <p>{material.description}</p>
              <img
                className="detail-image"
                src={material.image_url}
                alt={material.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default-material.jpg";
                }}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

// Страница корзины в стиле calc.html
const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, updateComment, clearCart, formCalculation } = useCart();
  const [mass, setMass] = React.useState('');
  const [frequency, setFrequency] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [comments, setComments] = React.useState<Record<number, string>>({});

  const handleQuantityChange = async (materialId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(materialId);
    } else {
      await updateQuantity(materialId, newQuantity);
    }
  };

  const handleCommentChange = (materialId: number, comment: string) => {
    setComments(prev => ({ ...prev, [materialId]: comment }));
  };

  const handleCommentSave = async (materialId: number) => {
    await updateComment(materialId, comments[materialId] || '');
  };

  const handleFormCalculation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mass || !frequency) {
      alert('Пожалуйста, введите массу и частоту');
      return;
    }
    
    if (cart.length === 0) {
      alert('Корзина пуста. Добавьте товары для расчета.');
      return;
    }

    setLoading(true);
    try {
      const result = await formCalculation(parseFloat(mass), parseFloat(frequency));
      setResults(result.calculation_results || []);
    } catch (error) {
      console.error('Error forming calculation:', error);
      alert('Ошибка при выполнении расчета: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Вы уверены, что хотите очистить корзину?')) {
      await clearCart();
      setResults([]);
    }
  };

  return (
    <div className="gradient-bg">
      <header className="container header">
        <div className="brand">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <img
              src={`${dest_root}/logo.png`}
              alt="UltraRezina"
              style={{
                width: '510px',
                height: '80px',
                borderRadius: '8px',
                objectFit: 'contain',
                background: '#ffffff00'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `${dest_root}/logo.png`;
              }}
            />
          </Link>
        </div>
      </header>
      
      <main className="container">
        <Breadcrumbs items={[
          { label: 'Материалы', href: '/' },
          { label: 'Расчёт' }
        ]} />
        <Link className="btn" to="/">Назад</Link>
        <button
          className="btn"
          onClick={handleClearCart}
          style={{ background: '#ff4444', color: 'white', marginLeft: '10px' }}
        >
          Очистить корзину
        </button>
        
        <form onSubmit={handleFormCalculation}>
          <section className="panel">
            <h2>Введите данные для расчёта</h2>
            <div className="calc-form" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                className="input"
                type="number"
                step="0.01"
                value={mass}
                onChange={(e) => setMass(e.target.value)}
                placeholder="Масса оборудования, кг"
                required
                style={{ flex: 1 }}
              />
              <input
                className="input"
                type="number"
                step="0.01"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="Рабочая частота, Гц"
                required
                style={{ flex: 1 }}
              />
              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? 'Расчет...' : 'Оформить заявку'}
              </button>
            </div>
          </section>

          <h2 className="center" style={{ textAlign: 'center', color: 'white', margin: '2rem 0' }}>Результат</h2>
          <section id="results" className="stack">
            {cart.length === 0 ? (
              <div className="muted" style={{ color: '#ccc', textAlign: 'center', padding: '2rem' }}>
                Добавьте товары для расчета.
              </div>
            ) : (
              cart.map((item) => {
                const result = results.find(r => r.material_id === item.material.id);
                return (
                  <div key={item.material.id} className="result-card" style={{
                    padding: '1.5rem',
                    border: '1px solid #3a3d41',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      {/* Изображение товара */}
                      <div style={{ flexShrink: 0 }}>
                        <img 
                          src={item.material.image_url} 
                          alt={item.material.name}
                          style={{
                            width: '120px',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            border: '1px solid #3a3d41',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      {/* Информация о товаре */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '18px', color: 'white' }}>
                              {item.material.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                  className="btn"
                                  onClick={() => handleQuantityChange(item.material.id, item.quantity - 1)}
                                  style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                                >
                                  -
                                </button>
                                <span style={{ color: 'white', minWidth: '2rem', textAlign: 'center' }}>
                                  {item.quantity}
                                </span>
                                <button
                                  className="btn"
                                  onClick={() => handleQuantityChange(item.material.id, item.quantity + 1)}
                                  style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                className="btn"
                                onClick={() => removeFromCart(item.material.id)}
                                style={{ 
                                  padding: '0.25rem 0.5rem', 
                                  minWidth: 'auto',
                                  backgroundColor: '#dc3545',
                                  borderColor: '#dc3545'
                                }}
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                          <div className="muted" style={{ fontSize: '11px', lineHeight: 1.3, marginLeft: '15px', maxWidth: '200px', textAlign: 'right', color: '#ccc' }}>
                            {item.material.props ? item.material.props.slice(0, 3).map((prop: string, index: number) => (
                              <span key={index}>
                                {index > 0 && <br />}
                                {prop}
                              </span>
                            )) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Поля для результатов расчёта */}
                    <div className="calc-results" style={{ marginTop: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>
                            Собственная частота (Гц)
                          </label>
                          <div className="result-field" style={{
                            padding: '8px 12px',
                            border: '1px solid #3a3d41',
                            borderRadius: '8px',
                            backgroundColor: '#1a1c1e',
                            color: 'white',
                            minHeight: '40px',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            {result ? result.result_freq.toFixed(2) : <span style={{ color: '#ccc' }}>—</span>}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>
                            Изоляция (%)
                          </label>
                          <div className="result-field" style={{
                            padding: '8px 12px',
                            border: '1px solid #3a3d41',
                            borderRadius: '8px',
                            backgroundColor: '#1a1c1e',
                            color: 'white',
                            minHeight: '40px',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            {result ? `${result.result_percent.toFixed(1)}%` : <span style={{ color: '#ccc' }}>—</span>}
                          </div>
                        </div>
                      </div>
                      
                      {/* Поле для комментария */}
                      <div style={{ marginTop: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>
                          Комментарий к товару
                        </label>
                        <textarea 
                          value={comments[item.material.id] || ''}
                          onChange={(e) => handleCommentChange(item.material.id, e.target.value)}
                          onBlur={() => handleCommentSave(item.material.id)}
                          placeholder="Введите комментарий к товару..."
                          style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '8px 12px',
                            border: '1px solid #3a3d41',
                            borderRadius: '8px',
                            background: '#1a1c1e',
                            color: '#fff',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </form>
      </main>
    </div>
  );
};

function App() {
  // Определяем базовый путь для GitHub Pages, локальной разработки или Tauri
  // В режиме разработки (localhost) basename должен быть "/"
  // В продакшене (GitHub Pages) basename должен быть "/RIP_Frontend"
  // В Tauri basename должен быть "" (пустая строка)
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
  const basename = isTauri ? '' : (isDev ? '/' : dest_root);
  
  // Проверка Tauri согласно гайду
  useEffect(() => {
    if (isTauri) {
      invoke('tauri', { cmd: 'create' })
        .then(() => { console.log("Tauri launched") })
        .catch(() => { console.log("Tauri not launched") });
      return () => {
        invoke('tauri', { cmd: 'close' })
          .then(() => { console.log("Tauri closed") })
          .catch(() => { console.log("Tauri not launched") });
      };
    }
  }, [isTauri]);
  
  return (
    <CartProvider>
      <Router basename={basename}>
        <div className="App">
          <TopNavbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/materials" element={<HomePage />} />
            <Route path="/materials/:id" element={<MaterialDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;