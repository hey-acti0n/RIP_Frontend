import React, { useState, FormEvent, useEffect } from 'react';
import { Form, Button, Alert, Container, Table } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../store/types';
import { getProfileAsync, updateProfileAsync, clearError } from '../../store/slices/userSlice';
import { getDestRoot } from '../../config/target_config';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { username, fullName, email, isAuthenticated, error, loading } = useSelector((state: RootState) => state.user);

    const [formData, setFormData] = useState({
        full_name: '',
        email: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [updateSuccess, setUpdateSuccess] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        dispatch(clearError());
        dispatch(getProfileAsync());
    }, [dispatch, navigate, isAuthenticated]);

    useEffect(() => {
        if (fullName && email) {
            setFormData({ full_name: fullName, email: email });
        }
    }, [fullName, email]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault();
        setUpdateSuccess(false);
        const result = await dispatch(updateProfileAsync(formData));
        if (updateProfileAsync.fulfilled.match(result)) {
            setUpdateSuccess(true);
        }
    };

    const handlePasswordReset = async (e: FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            alert('Пароль должен содержать минимум 6 символов');
            return;
        }
        // TODO: Реализовать сброс пароля через API, если такой endpoint есть
        alert('Функция сброса пароля будет реализована после добавления соответствующего API endpoint');
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
            <Container style={{ maxWidth: '800px', marginTop: '50px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>Личный кабинет</h1>
                
                {error && <Alert variant="danger">{error}</Alert>}
                {updateSuccess && <Alert variant="success">Профиль успешно обновлен</Alert>}

                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ color: 'white', marginBottom: '20px' }}>Информация о пользователе</h3>
                    <Table striped bordered hover variant="dark">
                        <tbody>
                            <tr>
                                <td><strong>Имя пользователя:</strong></td>
                                <td>{username}</td>
                            </tr>
                            <tr>
                                <td><strong>Полное имя:</strong></td>
                                <td>{fullName}</td>
                            </tr>
                            <tr>
                                <td><strong>Email:</strong></td>
                                <td>{email}</td>
                            </tr>
                        </tbody>
                    </Table>
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ color: 'white', marginBottom: '20px' }}>Редактирование профиля</h3>
                    <Form onSubmit={handleUpdateProfile}>
                        <Form.Group controlId="full_name" style={{ marginBottom: '15px' }}>
                            <Form.Label style={{ color: 'white' }}>Полное имя</Form.Label>
                            <Form.Control
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Введите полное имя"
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="email" style={{ marginBottom: '20px' }}>
                            <Form.Label style={{ color: 'white' }}>Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Введите email"
                                required
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Сохранение...' : 'Сохранить изменения'}
                        </Button>
                    </Form>
                </div>

                <div>
                    <h3 style={{ color: 'white', marginBottom: '20px' }}>Сброс пароля</h3>
                    <Form onSubmit={handlePasswordReset}>
                        <Form.Group controlId="currentPassword" style={{ marginBottom: '15px' }}>
                            <Form.Label style={{ color: 'white' }}>Текущий пароль</Form.Label>
                            <Form.Control
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                placeholder="Введите текущий пароль"
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="newPassword" style={{ marginBottom: '15px' }}>
                            <Form.Label style={{ color: 'white' }}>Новый пароль</Form.Label>
                            <Form.Control
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                placeholder="Введите новый пароль (минимум 6 символов)"
                                required
                                minLength={6}
                            />
                        </Form.Group>
                        <Form.Group controlId="confirmPassword" style={{ marginBottom: '20px' }}>
                            <Form.Label style={{ color: 'white' }}>Подтвердите новый пароль</Form.Label>
                            <Form.Control
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder="Подтвердите новый пароль"
                                required
                                minLength={6}
                            />
                        </Form.Group>
                        <Button variant="warning" type="submit">
                            Сбросить пароль
                        </Button>
                    </Form>
                </div>
            </Container>
        </div>
    );
};

export default ProfilePage;

