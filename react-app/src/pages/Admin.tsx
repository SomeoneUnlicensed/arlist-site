import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [redirectUris, setRedirectUris] = useState('');
  const [isTrusted, setIsTrusted] = useState(false);

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

  useEffect(() => {
    fetchClients();
  }, [navigate]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const uris = redirectUris.split(',').map(u => u.trim()).filter(u => u);
      const res = await axios.post('/api/admin/clients', {
        name,
        redirectUris: uris,
        isTrusted
      });
      
      const newClient = res.data;
      setSuccess(`Приложение успешно создано! Сохраните Client Secret, он показывается только один раз: ${newClient.clientSecret}`);
      setName('');
      setRedirectUris('');
      setIsTrusted(false);
      fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при создании приложения');
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'block', padding: '40px 24px' }}>
      <div className="mb-8">
        <h1 className="auth-title">Админ-панель</h1>
        <p className="auth-subtitle">Управление OIDC-приложениями (Arlist ID)</p>
        <button onClick={() => navigate('/profile')} className="btn-auth" style={{ width: 'auto', background: 'transparent', color: 'var(--ac-white)', border: '1px solid var(--ac-gray-20)', padding: '8px 16px' }}>
          ← Назад в профиль
        </button>
      </div>

      <div className="auth-card" style={{ maxWidth: 'none', marginBottom: '40px' }}>
        <h2 className="text-xl font-semibold mb-4 border-b border-[var(--ac-gray-10)] pb-4">Зарегистрированные приложения</h2>
        
        {clients.length === 0 ? (
          <p className="text-gray-400 my-4">Нет зарегистрированных приложений.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ac-gray-10)', color: 'var(--ac-gray-40)', fontSize: '0.85rem' }}>
                  <th className="py-3 px-4 font-mono font-normal">Название</th>
                  <th className="py-3 px-4 font-mono font-normal">Client ID</th>
                  <th className="py-3 px-4 font-mono font-normal">Redirect URIs</th>
                  <th className="py-3 px-4 font-mono font-normal">Доверенное (isTrusted)</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id} style={{ borderBottom: '1px solid var(--ac-gray-05)' }}>
                    <td className="py-4 px-4 font-medium">{client.name}</td>
                    <td className="py-4 px-4 font-mono text-sm text-[var(--ac-gray-50)]">{client.clientId}</td>
                    <td className="py-4 px-4 text-sm text-[var(--ac-gray-40)]">
                      {client.redirectUris.map((u: string) => <div key={u}>{u}</div>)}
                    </td>
                    <td className="py-4 px-4">
                      {client.isTrusted ? (
                        <span style={{ color: '#88ffcc', background: 'rgba(136, 255, 204, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Да (расш. права)</span>
                      ) : (
                        <span style={{ color: 'var(--ac-gray-40)' }}>Нет</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <h2 className="text-xl font-semibold mb-4">Добавить новое приложение</h2>
        
        {error && <div className="text-red-500 text-sm mb-4" style={{ color: '#ff8888', background: 'rgba(255, 136, 136, 0.1)', padding: '12px', borderRadius: '4px' }}>{error}</div>}
        {success && <div className="text-green-500 text-sm mb-4" style={{ color: '#88ffcc', background: 'rgba(136, 255, 204, 0.1)', padding: '12px', borderRadius: '4px', wordBreak: 'break-all' }}>{success}</div>}

        <form onSubmit={handleCreateClient}>
          <div className="form-group">
            <label className="form-label">Название приложения</label>
            <input 
              type="text" 
              className="form-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setRedirectUris(e.target.value)}
              placeholder="https://example.com/callback, http://localhost:3000/callback"
              required 
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              id="isTrusted"
              checked={isTrusted} 
              onChange={(e) => setIsTrusted(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--ac-white)' }}
            />
            <label htmlFor="isTrusted" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
              Доверенное внутреннее приложение
            </label>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--ac-gray-40)', margin: '-16px 0 24px 30px' }}>
            Включите эту опцию только для собственных проектов Arlist. Доверенные приложения получают расширенный доступ к данным пользователя (включая роль).
          </p>

          <button type="submit" className="btn-auth">Создать OIDC-клиента</button>
        </form>
      </div>
    </div>
  );
};

export default Admin;
