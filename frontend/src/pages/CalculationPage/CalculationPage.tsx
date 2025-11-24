import React, { useEffect, useState } from 'react';
import { Container, Button, Alert, Form, Spinner, Row, Col, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../store/types';
import {
    getCalculationById,
    getCalculationMaterials,
    removeMaterialFromCalculation,
    updateMaterialInCalculation,
    formCalculation,
    deleteCalculation,
    clearCurrentCalculation,
    getCartInfo
} from '../../store/slices/calculationsSlice';
import { getDestRoot, dest_img } from '../../config/target_config';
import './CalculationPage.css';

const CalculationPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { currentCalculation, calculationMaterials, loading, error } = useSelector((state: RootState) => state.calculations);
    const { isAuthenticated } = useSelector((state: RootState) => state.user);

    const [formData, setFormData] = useState({
        installation_weight: '',
        natural_frequency: ''
    });
    const [materialQuantities, setMaterialQuantities] = useState<{ [key: number]: number }>({});

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (id) {
            dispatch(getCalculationById(parseInt(id)));
            dispatch(getCalculationMaterials(parseInt(id)));
        }
        return () => {
            dispatch(clearCurrentCalculation());
        };
    }, [dispatch, navigate, id, isAuthenticated]);

    useEffect(() => {
        if (calculationMaterials.length > 0) {
            const quantities: { [key: number]: number } = {};
            calculationMaterials.forEach((item) => {
                quantities[item.material_id] = item.quantity;
            });
            setMaterialQuantities(quantities);
        }
    }, [calculationMaterials]);

    // Черновик - это статус "pending" в бэкенде
    const isDraft = currentCalculation?.status === 'pending' || currentCalculation?.status === 'draft' || currentCalculation?.status === '1';

    const handleQuantityChange = async (materialId: number, newQuantity: number) => {
        if (!id || newQuantity < 1) return;
        setMaterialQuantities({ ...materialQuantities, [materialId]: newQuantity });
        await dispatch(updateMaterialInCalculation({
            calculationId: parseInt(id),
            materialId,
            updates: { quantity: newQuantity }
        }));
        dispatch(getCalculationMaterials(parseInt(id)));
    };

    const handleRemoveMaterial = async (materialId: number) => {
        if (!id) return;
        if (window.confirm('Вы уверены, что хотите удалить этот материал из заявки?')) {
            await dispatch(removeMaterialFromCalculation({
                calculationId: parseInt(id),
                materialId
            }));
            // Обновляем материалы и информацию о корзине
            dispatch(getCalculationMaterials(parseInt(id)));
            dispatch(getCartInfo());
        }
    };

    const handleFormCalculation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !formData.installation_weight || !formData.natural_frequency) {
            alert('Заполните все поля');
            return;
        }
        const result = await dispatch(formCalculation({
            calculationId: parseInt(id),
            data: {
                installation_weight: parseFloat(formData.installation_weight),
                natural_frequency: parseFloat(formData.natural_frequency)
            }
        }));
        if (formCalculation.fulfilled.match(result)) {
            // Обновляем заявку и материалы
            dispatch(getCalculationById(parseInt(id)));
            dispatch(getCalculationMaterials(parseInt(id)));
            // Обновляем информацию о корзине (заявка больше не черновик)
            dispatch(getCartInfo());
            alert('Заявка успешно сформирована!');
        }
    };

    const handleDeleteCalculation = async () => {
        if (!id) return;
        if (window.confirm('Вы уверены, что хотите удалить эту заявку?')) {
            const result = await dispatch(deleteCalculation(parseInt(id)));
            if (deleteCalculation.fulfilled.match(result)) {
                // Обновляем информацию о корзине после удаления
                dispatch(getCartInfo());
                navigate('/calculations');
            }
        }
    };

    if (!isAuthenticated || !currentCalculation) {
        return null;
    }

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
                        />
                    </Link>
                </div>
            </header>
            <Container style={{ maxWidth: '1200px', marginTop: '50px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Link to="/calculations" className="btn btn-secondary">← Назад к списку заявок</Link>
                </div>

                <h1 style={{ color: 'white', marginBottom: '30px' }}>
                    Заявка #{currentCalculation.id}
                    <span className={`badge bg-${isDraft ? 'secondary' : 'info'}`} style={{ marginLeft: '15px' }}>
                        {isDraft ? 'Черновик' : (currentCalculation.status === 'pending' ? 'Черновик' : currentCalculation.status)}
                    </span>
                </h1>

                {error && <Alert variant="danger">{error}</Alert>}

                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" variant="light" />
                    </div>
                ) : (
                    <>
                        <Card className="mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: 'none' }}>
                            <Card.Body>
                                <h3 style={{ color: 'white', marginBottom: '20px' }}>Информация о заявке</h3>
                                <Row>
                                    <Col md={6}>
                                        <p style={{ color: 'white' }}><strong>Название:</strong> {currentCalculation.title || 'Без названия'}</p>
                                        <p style={{ color: 'white' }}><strong>Описание:</strong> {currentCalculation.description || '-'}</p>
                                        <p style={{ color: 'white' }}><strong>Дата создания:</strong> {new Date(currentCalculation.created_at).toLocaleDateString('ru-RU')}</p>
                                    </Col>
                                    <Col md={6}>
                                        {currentCalculation.formed_at && (
                                            <p style={{ color: 'white' }}><strong>Дата формирования:</strong> {new Date(currentCalculation.formed_at).toLocaleDateString('ru-RU')}</p>
                                        )}
                                        {currentCalculation.total_cost && (
                                            <p style={{ color: 'white' }}><strong>Стоимость:</strong> {currentCalculation.total_cost.toFixed(2)} ₽</p>
                                        )}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {isDraft && (
                            <Card className="mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: 'none' }}>
                                <Card.Body>
                                    <h3 style={{ color: 'white', marginBottom: '20px' }}>Формирование заявки</h3>
                                    <Form onSubmit={handleFormCalculation}>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label style={{ color: 'white' }}>Масса установки (кг)</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.installation_weight}
                                                        onChange={(e) => setFormData({ ...formData, installation_weight: e.target.value })}
                                                        placeholder="Введите массу установки"
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label style={{ color: 'white' }}>Собственная частота (Гц)</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.natural_frequency}
                                                        onChange={(e) => setFormData({ ...formData, natural_frequency: e.target.value })}
                                                        placeholder="Введите частоту"
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Button variant="primary" type="submit" disabled={calculationMaterials.length === 0}>
                                            Подтвердить заявку
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        )}

                        <h3 style={{ color: 'white', marginBottom: '20px' }}>Материалы в заявке</h3>
                        {calculationMaterials.length === 0 ? (
                            <Alert variant="info">В заявке пока нет материалов</Alert>
                        ) : (
                            <Row>
                                {calculationMaterials.map((item) => (
                                    <Col md={6} key={item.material_id} className="mb-3">
                                        <Card style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: 'none' }}>
                                            <Card.Body>
                                                <div style={{ display: 'flex', gap: '15px' }}>
                                                    {item.material?.image_url && (
                                                        <img
                                                            src={item.material.image_url.startsWith('http') 
                                                                ? item.material.image_url 
                                                                : `${dest_img}${item.material.image_url}`}
                                                            alt={item.material.name}
                                                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                                                        />
                                                    )}
                                                    <div style={{ flex: 1 }}>
                                                        <h5 style={{ color: 'white' }}>{item.material?.name || 'Материал'}</h5>
                                                        <p style={{ color: 'white', fontSize: '14px' }}>{item.material?.description || ''}</p>
                                                        {isDraft ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                                                <span style={{ color: 'white' }}>Количество:</span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-light"
                                                                    onClick={() => handleQuantityChange(item.material_id, (materialQuantities[item.material_id] || item.quantity) - 1)}
                                                                >
                                                                    -
                                                                </Button>
                                                                <span style={{ color: 'white', minWidth: '30px', textAlign: 'center' }}>
                                                                    {materialQuantities[item.material_id] || item.quantity}
                                                                </span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-light"
                                                                    onClick={() => handleQuantityChange(item.material_id, (materialQuantities[item.material_id] || item.quantity) + 1)}
                                                                >
                                                                    +
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="danger"
                                                                    onClick={() => handleRemoveMaterial(item.material_id)}
                                                                    style={{ marginLeft: '10px' }}
                                                                >
                                                                    Удалить
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <p style={{ color: 'white' }}>Количество: {item.quantity}</p>
                                                        )}
                                                        {item.result_freq && (
                                                            <p style={{ color: 'white', fontSize: '12px' }}>
                                                                Частота: {item.result_freq.toFixed(2)} Гц, Изоляция: {item.result_percent?.toFixed(1)}%
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}

                        {isDraft && (
                            <div style={{ marginTop: '30px', textAlign: 'center' }}>
                                <Button variant="danger" onClick={handleDeleteCalculation}>
                                    Удалить заявку
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </Container>
        </div>
    );
};

export default CalculationPage;

