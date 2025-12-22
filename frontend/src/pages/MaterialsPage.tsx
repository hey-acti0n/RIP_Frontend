import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import type { Material } from '../types/api';
import { useFilters, updateFilterAction, resetFiltersAction } from '../store/slices/filtersSlice';
import type { AppDispatch, RootState } from '../store/types';
import { 
  addMaterialToCalcIsolation, 
  getIsolationCartInfo
} from '../store/slices/calculationsSlice';
import { apiService } from '../services/api';
import { getDestRoot, dest_img } from '../config/target_config';
import { useCart } from '../App';
import { useMaterialSearch } from '../hooks/useMaterialSearch';
import './MaterialsPage.css';

const MaterialsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const filters = useFilters();
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addingMaterialId, setAddingMaterialId] = React.useState<number | null>(null);
  const { getTotalItems, loadCartFromDB } = useCart();
  const { isAuthenticated } = useSelector((state: RootState) => state.user);
  
  // CLIP поиск
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    materials: processedMaterials, 
    ready: clipReady, 
    progress: clipProgress,
    imageEmbedding,
    searchByImage, 
    resetSearch 
  } = useMaterialSearch(materials);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Image file selected:', file.name, file.size, 'bytes');
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      console.log('Calling searchByImage, processedMaterials count:', processedMaterials.length);
      console.log('Materials with embeddings:', processedMaterials.filter((m: any) => m.embedding).length);
      searchByImage(file);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    resetSearch();
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        {/* Блок поиска по изображению */}
        <section className="clip-search-section" style={{ 
          marginBottom: '30px', 
          padding: '20px', 
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '12px' 
        }}>
          <h3 style={{ color: 'white', marginBottom: '15px' }}>AI Поиск по изображению</h3>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />

            <div style={{ flexShrink: 0 }}>
              {selectedImage ? (
                <img src={selectedImage} alt="Query" className="preview-image" style={{
                  width: '150px',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '2px solid #dee2e6'
                }} />
              ) : (
                <div className="placeholder-image" style={{
                  width: '150px',
                  height: '150px',
                  background: '#e9ecef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  color: '#adb5bd',
                  border: '2px dashed #dee2e6'
                }}>
                  Нет фото
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '200px' }}>
              <button
                type="button"
                className="btn primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={!clipReady}
                style={{ width: '100%', minHeight: '42px' }}
              >
                {clipReady ? 'Загрузить фото' : `Загрузка нейросети... ${Math.round(clipProgress)}%`}
              </button>

              {imageEmbedding && (
                <div style={{ fontSize: '10px', color: '#0d6efd', wordBreak: 'break-all' }}>
                  <strong>Image Embed: </strong><br/>
                  [{imageEmbedding.slice(0, 5).map(n => n.toFixed(3)).join(', ')}...]
                </div>
              )}
              
              <button
                type="button"
                className="btn"
                onClick={handleClearImage}
                disabled={!selectedImage}
                style={{ width: '100%', minHeight: '42px' }}
              >
                Сбросить поиск
              </button>
            </div>
          </div>
        </section>

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
          ) : (() => {
            // Временно показываем все материалы при поиске по изображению, даже если isVisible = false
            // Это поможет понять, работает ли поиск вообще
            const displayMaterials = selectedImage 
              ? processedMaterials // Показываем все, не фильтруем по isVisible
              : materials;
            console.log('Rendering materials:', {
              displayCount: displayMaterials.length,
              selectedImage: !!selectedImage,
              processedMaterialsCount: processedMaterials.length,
              processedWithEmbeddings: processedMaterials.filter((m: any) => m.embedding).length,
              processedVisible: processedMaterials.filter((m: any) => m.isVisible).length,
              regularMaterialsCount: materials.length,
              sampleProcessedMaterial: processedMaterials[0] ? {
                id: processedMaterials[0].id,
                hasEmbedding: !!processedMaterials[0].embedding,
                score: processedMaterials[0].score,
                isVisible: processedMaterials[0].isVisible
              } : null
            });
            return displayMaterials.length === 0 ? (
              <div className="text-center" style={{ color: 'white', gridColumn: '1 / -1' }}>
                <h3>Материалы не найдены</h3>
                <p>Попробуйте изменить параметры поиска</p>
                {selectedImage && (
                  <p style={{ fontSize: '12px', marginTop: '10px' }}>
                    Отфильтровано: {processedMaterials.length} материалов, видимых: {processedMaterials.filter((m: any) => m.isVisible).length}
                  </p>
                )}
              </div>
            ) : (
              displayMaterials.map((material: any) => (
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
                            const result = await dispatch(addMaterialToCalcIsolation(material.id));
                            if (addMaterialToCalcIsolation.fulfilled.match(result)) {
                              // Redux обновляется автоматически через addMaterialToCalcIsolation.fulfilled
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
                    {selectedImage && material.score !== undefined && (
                      <div style={{ 
                        marginBottom: '8px', 
                        fontWeight: 'bold', 
                        color: material.score > 0.1 ? '#198754' : material.score > 0 ? '#ffc107' : '#dc3545',
                        fontSize: '12px'
                      }}>
                        Сходство: {(material.score * 100).toFixed(2)}%
                      </div>
                    )}
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
            );
          })()}
        </section>
      </main>
    </div>
  );
};

export default MaterialsPage;
