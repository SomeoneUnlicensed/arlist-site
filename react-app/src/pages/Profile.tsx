import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PALETTES = [
  { bg: 'linear-gradient(135deg, #1a1a3e, #3a3a8f)', border: 'rgba(100,100,200,0.3)' },
  { bg: 'linear-gradient(135deg, #1a2e1a, #2a7a3a)', border: 'rgba(80,160,90,0.3)' },
  { bg: 'linear-gradient(135deg, #2e1a1a, #8f3a3a)', border: 'rgba(160,80,80,0.3)' },
  { bg: 'linear-gradient(135deg, #1a2a2e, #2a6a8f)', border: 'rgba(60,140,180,0.3)' },
  { bg: 'linear-gradient(135deg, #2a1a2e, #7a3a9f)', border: 'rgba(140,80,200,0.3)' },
];

function palette(seed: string) {
  return PALETTES[(seed.charCodeAt(0) || 0) % PALETTES.length];
}

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/auth/profile')
      .then(r => setUser(r.data))
      .catch(() => navigate('/login'));
  }, [navigate]);

  const logout = async () => {
    await axios.post('/api/auth/logout');
    navigate('/login');
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--ac-gray-30)', fontSize: '0.875rem' }}>Загрузка...</span>
      </div>
    );
  }

  const initials = (user.name || user.email || '?').slice(0, 1).toUpperCase();
  const pal = palette(initials);

  return (
    <div className="profile-page">
      {/* Top navigation */}
      <nav className="profile-nav">
        <a href="/" className="profile-nav-brand">
          <div className="auth-logo-mark">A</div>
          Arlist ID
        </a>
        <div className="profile-nav-actions">
          {user.role === 'ADMIN' && (
            <button className="btn-sm btn-sm-primary" onClick={() => navigate('/admin')}>
              Управление
            </button>
          )}
          <button className="btn-sm" onClick={logout}>Выйти</button>
        </div>
      </nav>

      {/* Page body */}
      <div className="profile-body">

        {/* Hero: avatar + name + badges */}
        <div className="profile-hero">
          <div
            className="profile-avatar-lg"
            style={{ background: pal.bg, border: `1px solid ${pal.border}` }}
          >
            {initials}
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-hero-name">{user.name || 'Без имени'}</h1>
            <div className="profile-hero-badges">
              <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
              </span>
              <span className={`badge ${user.isVerified ? 'badge-verified' : 'badge-unverified'}`}>
                {user.isVerified ? '✓ Подтверждён' : 'Не подтверждён'}
              </span>
            </div>
          </div>
        </div>

        {/* Account details */}
        <div className="profile-section-card">
          <div className="profile-section-header">Аккаунт</div>
          <div className="profile-row">
            <span className="profile-row-label">Email</span>
            <span className="profile-row-value">{user.email}</span>
          </div>
          {user.name && (
            <div className="profile-row">
              <span className="profile-row-label">Имя</span>
              <span className="profile-row-value">{user.name}</span>
            </div>
          )}
          <div className="profile-row">
            <span className="profile-row-label">ID</span>
            <span className="profile-row-value mono">{user.id}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
