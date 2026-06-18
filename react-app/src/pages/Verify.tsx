import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const Verify = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('/api/auth/verify', { email, code });
      navigate('/auth/login?verified=true');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Подтверждение</h1>
        <p className="auth-subtitle">Введите 6-значный код, отправленный на {email}.</p>
        
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Код из письма</label>
            <input 
              type="text" 
              className="form-input" 
              value={code} 
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required 
            />
          </div>
          <button type="submit" className="btn-auth">Подтвердить</button>
        </form>
      </div>
    </div>
  );
};

export default Verify;
