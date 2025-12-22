import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import type { Material } from '../types/api';
import { useFilters, updateFilterAction, resetFiltersAction } from '../store/slices/filtersSlice';
import type { AppDispatch, RootState } from '../store/types';
import { 
  addMaterialToCalculation, 
  getCartInfo
} from '../store/slices/calculationsSlice';
import { apiService } from '../services/api';
import { getDestRoot, dest_img } from '../config/target_config';
import { useCart } from '../App';

const MaterialsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const filters = useFilters();
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addingMaterialId, setAddingMaterialId] = React.useState<number | null>(null);
  const { getTotalItems, loadCartFromDB } = useCart();
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

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
        // Если путь начинается с '/', добавляем базовый URL MinIO
        const materialsWithFullUrls = response.data.map((material: Material) => ({
          ...material,
          image_url: !material.image_url || material.image_url.trim() === ''
            ? `${getDestRoot()}/logo.png`
            : material.image_url.startsWith('http')
            ? material.image_url 
            : material.image_url.startsWith('/')
            ? `${dest_img}${material.image_url}`
            : `${dest_img}/${material.image_url}`,
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
      // Если путь начинается с '/', добавляем базовый URL MinIO
      const materialsWithFullUrls = response.data.map((material: Material) => ({
        ...material,
        image_url: material.image_url.startsWith('http')
          ? material.image_url 
          : material.image_url.startsWith('/')
          ? `${dest_img}${material.image_url}`
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
              src={`${getDestRoot()}/logo.png`}
              alt="UltraRezina"
              style={{
                width: '510px',
                height: '80px',
                borderRadius: '8px',
                objectFit: 'contain',
                background: '#ffffff00'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `${getDestRoot()}/logo.png`;
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
                src={`${getDestRoot()}/search_icon.png`}
                alt="search"
                style={{ width: '40px', height: '40px', verticalAlign: 'middle' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `${getDestRoot()}/logo.png`;
                }}
              />
            </button>
            <div className="cart-container">
              <Link
                className="icon-btn"
                to="/cart"
              >
                <img
                  src={`${getDestRoot()}/cart_icon.png`}
                  alt="Корзина"
                  style={{ width: '40px', height: '40px', verticalAlign: 'middle' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `${getDestRoot()}/logo.png`;
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
                    src={material.image_url || `${getDestRoot()}/logo.png`} 
                    alt={material.name}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `${getDestRoot()}/logo.png`;
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="actions" style={{ flex: 1 }}>
                    <Link className="btn" to={`/materials/${material.id}`}>Подробнее</Link>
                    {isAuthenticated && (
                      <button 
                        className="btn primary" 
                        type="button"
                        disabled={addingMaterialId === material.id}
                        onClick={async () => {
                          setAddingMaterialId(material.id);
                          try {
                            const result = await dispatch(addMaterialToCalculation(material.id));
                            if (addMaterialToCalculation.fulfilled.match(result)) {
                              // Redux обновляется автоматически через addMaterialToCalculation.fulfilled
                              // Корзина обновится через useEffect при изменении calculation_id
                            } else {
                              alert('Ошибка при добавлении материала');
                            }
                          } catch (error) {
                            console.error('Error adding to cart:', error);
                            alert('Ошибка при добавлении материала');
                          } finally {
                            setAddingMaterialId(null);
                          }
                        }}
                      >
                        {addingMaterialId === material.id ? 'Добавляем...' : 'Добавить'}
                      </button>
                    )}
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

export default MaterialsPage;
