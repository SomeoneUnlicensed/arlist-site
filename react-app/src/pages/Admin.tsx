import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ── helpers ───────────────────────────────────────────────

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`copy-btn${copied ? ' copied' : ''}`}
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? 'скопировано' : 'копировать'}
    </button>
  );
};

// ── Users tab ─────────────────────────────────────────────

const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/admin/users');
      setUsers(r.data);
    } catch { setErr('Не удалось загрузить'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const ban = async (id: string, isBanned: boolean) => {
    try { await axios.patch(`/api/admin/users/${id}`, { isBanned }); fetch(); }
    catch { setErr('Ошибка'); }
  };

  const promote = async (id: string, role: string) => {
    try { await axios.patch(`/api/admin/users/${id}`, { role }); fetch(); }
    catch { setErr('Ошибка'); }
  };

  const remove = async (id: string, email: string) => {
    if (!confirm(`Удалить ${email}?`)) return;
    try { await axios.delete(`/api/admin/users/${id}`); fetch(); }
    catch { setErr('Ошибка удаления'); }
  };

  if (loading) return <div style={{ padding: '40px 24px', color: 'var(--ac-gray-30)', fontSize: '0.875rem' }}>Загрузка...</div>;

  return (
    <div>
      {err && <div className="alert alert-error" style={{ margin: '16px 24px 0' }}>{err}</div>}
      {users.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ac-gray-30)', fontSize: '0.875rem' }}>Нет пользователей</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{u.name || '—'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ac-gray-40)', fontFamily: 'var(--font-mono)' }}>{u.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                      {u.role === 'ADMIN' ? 'Админ' : 'Юзер'}
                    </span>
                  </td>
                  <td>
                    {u.isBanned
                      ? <span className="badge" style={{ color: '#ff8c8c', background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)' }}>Забанен</span>
                      : <span className={`badge ${u.isVerified ? 'badge-verified' : 'badge-unverified'}`}>{u.isVerified ? 'Активен' : 'Не верифицирован'}</span>
                    }
                  </td>
                  <td style={{ color: 'var(--ac-gray-30)', fontSize: '0.78rem' }}>
                    {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {u.isBanned
                        ? <button className="copy-btn" onClick={() => ban(u.id, false)}>разбанить</button>
                        : <button className="copy-btn" style={{ color: '#ff8c8c', borderColor: 'rgba(255,100,100,0.25)' }} onClick={() => ban(u.id, true)}>бан</button>
                      }
                      {u.role === 'USER'
                        ? <button className="copy-btn" style={{ color: '#c9aaff', borderColor: 'rgba(180,140,255,0.25)' }} onClick={() => promote(u.id, 'ADMIN')}>→ админ</button>
                        : <button className="copy-btn" onClick={() => promote(u.id, 'USER')}>→ юзер</button>
                      }
                      <button className="copy-btn" style={{ color: '#ff8c8c', borderColor: 'rgba(255,100,100,0.25)' }} onClick={() => remove(u.id, u.email)}>удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Clients tab ───────────────────────────────────────────

const ClientsTab = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [redirectUris, setRedirectUris] = useState('');
  const [isTrusted, setIsTrusted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSecret, setNewSecret] = useState('');
  const [err, setErr] = useState('');

  const fetch = async () => {
    try { const r = await axios.get('/api/admin/clients'); setClients(r.data); }
    catch { setErr('Не удалось загрузить'); }
  };

  useEffect(() => { fetch(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setNewSecret(''); setLoading(true);
    try {
      const uris = redirectUris.split(',').map(u => u.trim()).filter(Boolean);
      const r = await axios.post('/api/admin/clients', { name, redirectUris: uris, isTrusted });
      setNewSecret(r.data.clientSecret);
      setName(''); setRedirectUris(''); setIsTrusted(false);
      fetch();
    } catch (e: any) { setErr(e.response?.data?.error || 'Ошибка'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '24px' }}>
      {err && <div className="alert alert-error">{err}</div>}
      {newSecret && (
        <div className="alert alert-success">
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Приложение создано. Сохраните Client Secret — показывается один раз.</div>
          <div style={{ display: 'flex', gap: 8, background: 'rgba(127,255,212,0.05)', padding: '8px 10px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', wordBreak: 'break-all' }}>
            <span style={{ flex: 1 }}>{newSecret}</span>
            <CopyButton text={newSecret} />
          </div>
        </div>
      )}

      {clients.length > 0 && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div className="admin-card-header">Зарегистрированные приложения ({clients.length})</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead><tr><th>Название</th><th>Client ID</th><th>Redirect URIs</th><th>Тип</th></tr></thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ac-gray-50)' }}>{c.clientId}</span>
                        <CopyButton text={c.clientId} />
                      </div>
                    </td>
                    <td>{c.redirectUris.map((u: string) => <div key={u} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ac-gray-40)' }}>{u}</div>)}</td>
                    <td>{c.isTrusted ? <span className="badge badge-verified">Доверенное</span> : <span className="badge badge-user">Обычное</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="admin-card" style={{ maxWidth: 520 }}>
        <div className="admin-card-header">Добавить приложение</div>
        <div className="admin-card-body">
          <form onSubmit={create}>
            <div className="form-group">
              <label className="form-label">Название</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Например: Arlist Analytics" required />
            </div>
            <div className="form-group">
              <label className="form-label">Redirect URIs (через запятую)</label>
              <input type="text" className="form-input" value={redirectUris} onChange={e => setRedirectUris(e.target.value)} placeholder="https://app.example.com/callback" required />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input type="checkbox" id="isTrusted" checked={isTrusted} onChange={e => setIsTrusted(e.target.checked)}
                style={{ width: 15, height: 15, marginTop: 3, accentColor: 'var(--ac-white)', flexShrink: 0, cursor: 'pointer' }} />
              <label htmlFor="isTrusted" style={{ cursor: 'pointer', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Доверенное приложение
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--ac-gray-30)', marginTop: 2 }}>Получает роль и статус верификации пользователя</span>
              </label>
            </div>
            <button type="submit" className="btn-auth" disabled={loading} style={{ marginTop: 8 }}>
              {loading && <span className="spinner" />}
              {loading ? 'Создаём...' : 'Создать OIDC-клиента'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Main Admin page ───────────────────────────────────────

const TABS = ['Пользователи', 'OIDC-клиенты'] as const;
type Tab = typeof TABS[number];

const Admin = () => {
  const [tab, setTab] = useState<Tab>('Пользователи');
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="profile-nav">
        <a href="/" className="profile-nav-brand">
          <div className="auth-logo-mark">A</div>
          Arlist ID
        </a>
        <div className="profile-nav-actions">
          <button className="btn-sm" onClick={() => navigate('/profile')}>← Профиль</button>
        </div>
      </nav>
    <div className="admin-container">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 500, letterSpacing: '-0.04em', margin: '0 0 4px' }}>Панель управления</h1>
        <p style={{ color: 'var(--ac-gray-40)', fontSize: '0.85rem', margin: 0 }}>Arlist ID</p>
      </div>

      <div className="admin-card">
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--ac-gray-08)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', padding: '14px 20px', cursor: 'pointer',
              fontSize: '0.875rem', fontFamily: 'inherit',
              color: tab === t ? 'var(--ac-white)' : 'var(--ac-gray-40)',
              borderBottom: tab === t ? '1px solid var(--ac-white)' : '1px solid transparent',
              marginBottom: -1, transition: 'color 0.2s',
            }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Пользователи' ? <UsersTab /> : <ClientsTab />}
      </div>
    </div>
    </div>
  );
};

export default Admin;
