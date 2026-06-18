import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" className={`copy-btn${copied ? ' copied' : ''}`} onClick={handle}>
      {copied ? 'скопировано' : 'копировать'}
    </button>
  );
};

const Admin = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [name, setName] = useState('');
  const [redirectUris, setRedirectUris] = useState('');
  const [isTrusted, setIsTrusted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchClients = async () => {
    try {
      const res = await axios.get('/api/admin/clients');
      setClients(res.data);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/profile');
      } else {
        setError('Не удалось загрузить список приложений');
      }
    }
  };

  useEffect(() => { fetchClients(); }, [navigate]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNewSecret('');
    setLoading(true);
    try {
      const uris = redirectUris.split(',').map(u => u.trim()).filter(u => u);
      const res = await axios.post('/api/admin/clients', { name, redirectUris: uris, isTrusted });
      setNewSecret(res.data.clientSecret);
      setName('');
      setRedirectUris('');
      setIsTrusted(false);
      fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при создании приложения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 500, letterSpacing: '-0.04em', margin: '0 0 4px' }}>
            Панель управления
          </h1>
          <p style={{ color: 'var(--ac-gray-40)', fontSize: '0.85rem', margin: 0 }}>
            OIDC-приложения · Arlist ID
          </p>
        </div>
        <button onClick={() => navigate('/profile')} className="btn-ghost" style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem' }}>
          ← Профиль
        </button>
      </div>

      {/* Clients table */}
      <div className="admin-card">
        <div className="admin-card-header">
          Зарегистрированные приложения
          <span style={{ marginLeft: '8px', color: 'var(--ac-gray-30)', fontSize: '0.8rem', fontWeight: 400 }}>
            ({clients.length})
          </span>
        </div>
        {clients.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ac-gray-30)', fontSize: '0.875rem' }}>
            Нет зарегистрированных приложений
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Client ID</th>
                  <th>Redirect URIs</th>
                  <th>Тип</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id}>
                    <td style={{ fontWeight: 500 }}>{client.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ac-gray-50)' }}>
                          {client.clientId}
                        </span>
                        <CopyButton text={client.clientId} />
                      </div>
                    </td>
                    <td>
                      {client.redirectUris.map((u: string) => (
                        <div key={u} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ac-gray-40)' }}>{u}</div>
                      ))}
                    </td>
                    <td>
                      {client.isTrusted
                        ? <span className="badge badge-verified">Доверенное</span>
                        : <span className="badge badge-user">Обычное</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create form */}
      <div className="admin-card" style={{ maxWidth: 560 }}>
        <div className="admin-card-header">Добавить приложение</div>
        <div className="admin-card-body">
          {error && <div className="alert alert-error">{error}</div>}
          {newSecret && (
            <div className="alert alert-success">
              <div style={{ marginBottom: '10px', fontWeight: 500 }}>
                Приложение создано. Сохраните Client Secret — он больше не будет показан.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(127,255,212,0.05)', padding: '10px 12px', borderRadius: '5px' }}>
                <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                  {newSecret}
                </span>
                <CopyButton text={newSecret} />
              </div>
            </div>
          )}

          <form onSubmit={handleCreateClient}>
            <div className="form-group">
              <label className="form-label">Название</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Например: Arlist Analytics"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Redirect URIs (через запятую)</label>
              <input
                type="text"
                className="form-input"
                value={redirectUris}
                onChange={e => setRedirectUris(e.target.value)}
                placeholder="https://app.example.com/callback"
                required
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                id="isTrusted"
                checked={isTrusted}
                onChange={e => setIsTrusted(e.target.checked)}
                style={{ width: '15px', height: '15px', marginTop: '3px', accentColor: 'var(--ac-white)', flexShrink: 0, cursor: 'pointer' }}
              />
              <label htmlFor="isTrusted" style={{ cursor: 'pointer', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Доверенное внутреннее приложение
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--ac-gray-30)', marginTop: '2px' }}>
                  Получает расширенные данные пользователя: роль, статус подтверждения
                </span>
              </label>
            </div>
            <button type="submit" className="btn-auth" disabled={loading} style={{ marginTop: '8px' }}>
              {loading && <span className="spinner" />}
              {loading ? 'Создаём...' : 'Создать OIDC-клиента'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Admin;
