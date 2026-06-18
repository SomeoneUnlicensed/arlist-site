import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const OTP_LENGTH = 6;

const Verify = () => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const v = value.slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    refs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < OTP_LENGTH) return;
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/verify', { email, code });
      navigate('/login?verified=true');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный или истёкший код');
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => refs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const isComplete = digits.every(d => d !== '');

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">A</div>
          <span className="auth-logo-text">Arlist ID</span>
        </div>

        <h1 className="auth-title">Подтверждение</h1>
        <p className="auth-subtitle">
          {email
            ? <>Код отправлен на <strong style={{ color: 'var(--ac-white)' }}>{email}</strong></>
            : 'Введите код из письма.'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="otp-group" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                className={`otp-input${d ? ' filled' : ''}`}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
              />
            ))}
          </div>
          <button type="submit" className="btn-auth" disabled={loading || !isComplete}>
            {loading && <span className="spinner" />}
            {loading ? 'Проверяем...' : 'Подтвердить'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/register" className="auth-link" style={{ color: 'var(--ac-gray-40)' }}>
            ← Назад к регистрации
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Verify;
