import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // We'll need to implement an admin-only API for this
    const fetchUsers = async () => {
      try {
        // Placeholder API endpoint
        // const res = await axios.get('/api/admin/users');
        // setUsers(res.data);
      } catch (err) {
        // navigate('/profile');
      }
    };
    fetchUsers();
  }, [navigate]);

  return (
    <div className="auth-container" style={{ maxWidth: '800px', margin: '0 auto', display: 'block' }}>
      <div className="auth-card" style={{ maxWidth: 'none' }}>
        <h1 className="auth-title">Админ-панель</h1>
        <p className="auth-subtitle">Управление пользователями и Arlist ID.</p>
        
        <div className="mt-8">
          <p className="text-gray-400">В разработке...</p>
        </div>

        <button onClick={() => navigate('/profile')} className="btn-auth mt-8">
          Назад в профиль
        </button>
      </div>
    </div>
  );
};

export default Admin;
