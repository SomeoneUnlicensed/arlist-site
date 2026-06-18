import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AVATAR_PALETTES = [
  { bg: 'linear-gradient(135deg, #1a1a3e, #3a3a8f)', border: 'rgba(100,100,200,0.25)' },
  { bg: 'linear-gradient(135deg, #1a2e1a, #2a7a3a)', border: 'rgba(80,160,90,0.25)' },
  { bg: 'linear-gradient(135deg, #2e1a1a, #8f3a3a)', border: 'rgba(160,80,80,0.25)' },
  { bg: 'linear-gradient(135deg, #1a2a2e, #2a6a8f)', border: 'rgba(60,140,180,0.25)' },
  { bg: 'linear-gradient(135deg, #2a1a2e, #7a3a9f)', border: 'rgba(140,80,200,0.25)' },
];

function avatarStyle(seed: string) {
  const p = AVATAR_PALETTES[(seed.charCodeAt(0) || 0) % AVATAR_PALETTES.length];
  return { background: p.bg, border: `1px solid ${p.border}` };
}

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/auth/profile')
      .then(res => setUser(res.data))
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleLogout = async () => {
    await axios.post('/api/auth/logout');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="auth-container">
        <span style={{ color: 'var(--ac-gray-30)', fontSize: '0.875rem' }}>Загрузка...</span>
      </div>
    );
  }

  const initials = (user.name || user.email || '?').slice(0, 1).toUpperCase();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">A</div>
          <span className="auth-logo-text">Arlist ID</span>
        </div>

        <div className="avatar" style={avatarStyle(initials)}>
          {initials}
        </div>

        <div style={{ marginBottom: '8px' }}>
          <h1 className="auth-title" style={{ margin: '0 0 10px' }}>
            {user.name || 'Без имени'}
          </h1>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
              {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
            </span>
            <span className={`badge ${user.isVerified ? 'badge-verified' : 'badge-unverified'}`}>
              {user.isVerified ? '✓ Подтверждён' : 'Не подтверждён'}
            </span>
          </div>
        </div>

        <div style={{ margin: '24px 0' }}>
          <div className="profile-field">
            <span className="profile-field-label">Email</span>
            <span className="profile-field-value">{user.email}</span>
          </div>
          {user.name && (
            <div className="profile-field">
              <span className="profile-field-label">Имя</span>
              <span className="profile-field-value">{user.name}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {user.role === 'ADMIN' && (
            <button onClick={() => navigate('/admin')} className="btn-auth">
              Панель управления
            </button>
          )}
          <button onClick={handleLogout} className="btn-ghost">
            Выйти из аккаунта
          </button>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{ background: 'none', border: 'none', color: 'var(--ac-gray-30)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
          >
            ← На главную
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
