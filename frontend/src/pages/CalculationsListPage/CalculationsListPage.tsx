import React, { useEffect, useState, useMemo } from 'react';
import { Container, Table, Spinner, Alert, Form, Row, Col, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../store/types';
import { getCalcIsolationList, triggerAsyncCalcIsolation } from '../../store/slices/calculationsSlice';
import { getDestRoot } from '../../config/target_config';
import './CalculationsListPage.css';

const CalculationsListPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { calculations, loading, error } = useSelector((state: RootState) => state.calculations);
    const { isAuthenticated } = useSelector((state: RootState) => state.user);
    
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('completed'); // По умолчанию "Завершённые"

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        // Загружаем рассчёты с выбранным статусом
        dispatch(getCalcIsolationList({ status: statusFilter }));
    }, [dispatch, navigate, isAuthenticated, statusFilter]);

    // Short Polling: автоматическое обновление списка заявок каждые 10 секунд
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        const fetchCalculations = () => {
            const filters: any = { status: statusFilter, silent: true }; // silent: true для тихого обновления
            if (dateFrom) {
                filters.formed_from = dateFrom;
            }
            if (dateTo) {
                filters.formed_to = dateTo;
            }
            // Используем silent обновление без показа loading состояния
            dispatch(getCalcIsolationList(filters));
        };

        // Устанавливаем интервал для периодического обновления
        const intervalId = setInterval(fetchCalculations, 10000); // Обновление каждые 10 секунд

        // Очищаем интервал при размонтировании компонента
        return () => clearInterval(intervalId);
    }, [dispatch, isAuthenticated, dateFrom, dateTo, statusFilter]);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const filters: any = { status: statusFilter };
        if (dateFrom) {
            filters.formed_from = dateFrom;
        }
        if (dateTo) {
            filters.formed_to = dateTo;
        }
        dispatch(getCalcIsolationList(filters));
    };

    const handleReset = () => {
        setDateFrom('');
        setDateTo('');
        setStatusFilter('completed');
        dispatch(getCalcIsolationList({ status: 'completed' }));
    };

    const handleTriggerAsyncCalculation = (calculationId: number) => {
        dispatch(triggerAsyncCalcIsolation(calculationId));
    };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: string; text: string } } = {
      'pending': { variant: 'secondary', text: 'Черновик' },
      'draft': { variant: 'secondary', text: 'Черновик' },
      'formed': { variant: 'info', text: 'Сформирован' },
      'completed': { variant: 'success', text: 'Завершен' },
      'rejected': { variant: 'danger', text: 'Отклонен' },
    };
    const statusInfo = statusMap[status] || { variant: 'secondary', text: status };
    return <span className={`badge bg-${statusInfo.variant}`}>{statusInfo.text}</span>;
  };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    // Мемоизируем таблицу для предотвращения лишних перерисовок
    // Используем строковое представление calculations для сравнения
    const calculationsKey = useMemo(() => 
        calculations.map(c => `${c.id}-${c.total_cost || 0}`).join(','), 
        [calculations]
    );
    
    const tableContent = useMemo(() => {
        return calculations.map((calculation) => (
            <tr key={calculation.id}>
                <td>{calculation.id}</td>
                <td>{calculation.title || calculation.description || 'Без названия'}</td>
                <td>{getStatusBadge(calculation.status)}</td>
                <td>{formatDate(calculation.created_at)}</td>
                <td>{formatDate(calculation.formed_at)}</td>
                <td>{formatDate(calculation.completed_at)}</td>
                <td>{calculation.total_cost ? `${calculation.total_cost.toFixed(2)} ₽` : '-'}</td>
                <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <Link
                            to={`/calculations/${calculation.id}`}
                            className="btn btn-sm btn-primary"
                        >
                            Просмотр
                        </Link>
                        <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleTriggerAsyncCalculation(calculation.id)}
                            disabled={loading}
                        >
                            Пересчитать
                        </Button>
                    </div>
                </td>
            </tr>
        ));
    }, [calculationsKey, loading]);

    if (!isAuthenticated) {
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
                <h1 style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>Мои рассчёты</h1>
                
                {/* Фильтры по датам и статусу */}
                <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    marginBottom: '30px' 
                }}>
                    <Form onSubmit={handleFilter}>
                        <Row className="g-3 align-items-end">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label style={{ color: 'white' }}>Статус</Form.Label>
                                    <Form.Select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                                    >
                                        <option value="completed">Завершённые</option>
                                        <option value="formed">Сформированные</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label style={{ color: 'white' }}>Дата от</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label style={{ color: 'white' }}>Дата до</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    style={{ width: '100%' }}
                                >
                                    Применить фильтр
                                </Button>
                            </Col>
                        </Row>
                        <Row className="g-3 mt-2">
                            <Col md={12}>
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={handleReset}
                                    style={{ width: '100%' }}
                                >
                                    Сбросить фильтры
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </div>
                
                {error && <Alert variant="danger">{error}</Alert>}

                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" variant="light" />
                    </div>
                ) : calculations.length === 0 ? (
                    <Alert variant="info" style={{ textAlign: 'center' }}>
                        У вас пока нет рассчётов
                    </Alert>
                ) : (
                    <Table striped bordered hover variant="dark" responsive>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Название</th>
                                <th>Статус</th>
                                <th>Дата создания</th>
                                <th>Дата формирования</th>
                                <th>Дата завершения</th>
                                <th>Стоимость</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableContent}
                        </tbody>
                    </Table>
                )}
            </Container>
        </div>
    );
};

export default CalculationsListPage;

