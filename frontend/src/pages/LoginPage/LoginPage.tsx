import React, { useState, FormEvent } from 'react';
import { Form, Button, Alert, Container } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../store/types';
import { loginUserAsync, clearError } from '../../store/slices/userSlice';
import { getDestRoot } from '../../config/target_config';
import './LoginPage.css';

const LoginPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ username: '', password: '' });
    const { error, loading } = useSelector((state: RootState) => state.user);

    React.useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (formData.username && formData.password) {
            const result = await dispatch(loginUserAsync(formData));
            if (loginUserAsync.fulfilled.match(result)) {
                navigate('/');
            }
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
                        />
                    </Link>
                </div>
            </header>
            <Container style={{ maxWidth: '400px', marginTop: '150px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: 'white' }}>Рады снова Вас видеть!</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="username" style={{ marginBottom: '15px' }}>
                        <Form.Label style={{ color: 'white' }}>Имя пользователя</Form.Label>
                        <Form.Control
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Введите имя пользователя"
                            required
                        />
                    </Form.Group>
                    <Form.Group controlId="password" style={{ marginBottom: '20px' }}>
                        <Form.Label style={{ color: 'white' }}>Пароль</Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Введите пароль"
                            required
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Вход...' : 'Войти'}
                    </Button>
                </Form>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Link to="/register" style={{ color: 'white' }}>Нет аккаунта? Зарегистрируйтесь</Link>
                </div>
            </Container>
        </div>
    );
};

export default LoginPage;

