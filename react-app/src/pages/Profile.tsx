import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/auth/profile');
        setUser(res.data);
      } catch (err) {
        navigate('/auth/login');
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await axios.post('/api/auth/logout');
    navigate('/auth/login');
  };

  if (!user) return <div className="auth-container">Загрузка...</div>;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Профиль</h1>
        <p className="auth-subtitle">Управление вашим Arlist ID.</p>
        
        <div className="mb-8">
          <div className="form-group">
            <span className="form-label">Email</span>
            <div className="text-white py-2">{user.email}</div>
          </div>
          <div className="form-group">
            <span className="form-label">Имя</span>
            <div className="text-white py-2">{user.name || 'Не указано'}</div>
          </div>
          <div className="form-group">
            <span className="form-label">Роль</span>
            <div className="text-white py-2">{user.role}</div>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-auth" style={{ background: 'transparent', color: 'var(--ac-white)', border: '1px solid var(--ac-gray-20)' }}>
          Выйти
        </button>
        
        {user.role === 'ADMIN' && (
          <button onClick={() => navigate('/admin')} className="btn-auth mt-4">
            Панель управления
          </button>
        )}
        
        <button onClick={() => window.location.href = '/'} className="btn-auth mt-4" style={{ background: 'transparent', color: 'var(--ac-gray-40)' }}>
          Вернуться на главную
        </button>
      </div>
    </div>
  );
};

export default Profile;
