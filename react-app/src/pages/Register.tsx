import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { email, password, name });
      navigate(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-brand">
        <h1 className="auth-brand-title">Arlist ID</h1>
        <p className="auth-brand-subtitle">Arlist ID — единый ключ к вашим сервисам.</p>
      </div>
      <div className="auth-card">
        <h1 className="auth-title">Регистрация</h1>
        <p className="auth-subtitle">Создайте аккаунт Arlist ID.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Имя</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как вас зовут?"
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" className="btn-auth" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Создаём...' : 'Создать аккаунт'}
          </button>
        </form>

        <div className="auth-footer">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="auth-link">Войти</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
