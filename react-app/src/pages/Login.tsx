import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const verified = searchParams.get('verified');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/login', { email, password });
      const returnTo = searchParams.get('return_to');
      if (returnTo) {
        window.location.href = returnTo;
      } else {
        navigate('/profile');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">A</div>
          <span className="auth-logo-text">Arlist ID</span>
        </div>

        <h1 className="auth-title">Вход</h1>
        <p className="auth-subtitle">Единый ключ к вашим сервисам.</p>

        {verified && (
          <div className="alert alert-success">Email подтверждён — можете войти.</div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
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
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn-auth" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <div className="auth-footer">
          Нет аккаунта?{' '}
          <Link to="/register" className="auth-link">Создать</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
