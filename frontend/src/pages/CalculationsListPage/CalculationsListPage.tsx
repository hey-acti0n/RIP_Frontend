import React, { useEffect } from 'react';
import { Container, Table, Spinner, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../store/types';
import { getCalculationsList } from '../../store/slices/calculationsSlice';
import { getDestRoot } from '../../config/target_config';
import './CalculationsListPage.css';

const CalculationsListPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { calculations, loading, error } = useSelector((state: RootState) => state.calculations);
    const { isAuthenticated } = useSelector((state: RootState) => state.user);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        dispatch(getCalculationsList());
    }, [dispatch, navigate, isAuthenticated]);

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
                <h1 style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>Мои заявки</h1>
                
                {error && <Alert variant="danger">{error}</Alert>}

                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" variant="light" />
                    </div>
                ) : calculations.length === 0 ? (
                    <Alert variant="info" style={{ textAlign: 'center' }}>
                        У вас пока нет заявок
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
                            {calculations.map((calculation) => (
                                <tr key={calculation.id}>
                                    <td>{calculation.id}</td>
                                    <td>{calculation.title || calculation.description || 'Без названия'}</td>
                                    <td>{getStatusBadge(calculation.status)}</td>
                                    <td>{formatDate(calculation.created_at)}</td>
                                    <td>{formatDate(calculation.formed_at)}</td>
                                    <td>{formatDate(calculation.completed_at)}</td>
                                    <td>{calculation.total_cost ? `${calculation.total_cost.toFixed(2)} ₽` : '-'}</td>
                                    <td>
                                        <Link
                                            to={`/calculations/${calculation.id}`}
                                            className="btn btn-sm btn-primary"
                                        >
                                            Просмотр
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Container>
        </div>
    );
};

export default CalculationsListPage;

