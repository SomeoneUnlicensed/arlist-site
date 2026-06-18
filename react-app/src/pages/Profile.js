import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const Profile = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('/api/auth/profile');
                setUser(res.data);
            }
            catch (err) {
                navigate('/auth/login');
            }
        };
        fetchProfile();
    }, [navigate]);
    const handleLogout = async () => {
        await axios.post('/api/auth/logout');
        navigate('/auth/login');
    };
    if (!user)
        return _jsx("div", { className: "auth-container", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." });
    return (_jsx("div", { className: "auth-container", children: _jsxs("div", { className: "auth-card", children: [_jsx("h1", { className: "auth-title", children: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C" }), _jsx("p", { className: "auth-subtitle", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0432\u0430\u0448\u0438\u043C Arlist ID." }), _jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "form-group", children: [_jsx("span", { className: "form-label", children: "Email" }), _jsx("div", { className: "text-white py-2", children: user.email })] }), _jsxs("div", { className: "form-group", children: [_jsx("span", { className: "form-label", children: "\u0418\u043C\u044F" }), _jsx("div", { className: "text-white py-2", children: user.name || 'Не указано' })] }), _jsxs("div", { className: "form-group", children: [_jsx("span", { className: "form-label", children: "\u0420\u043E\u043B\u044C" }), _jsx("div", { className: "text-white py-2", children: user.role })] })] }), _jsx("button", { onClick: handleLogout, className: "btn-auth", style: { background: 'transparent', color: 'var(--ac-white)', border: '1px solid var(--ac-gray-20)' }, children: "\u0412\u044B\u0439\u0442\u0438" }), user.role === 'ADMIN' && (_jsx("button", { onClick: () => navigate('/admin'), className: "btn-auth mt-4", children: "\u041F\u0430\u043D\u0435\u043B\u044C \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F" })), _jsx("button", { onClick: () => window.location.href = '/', className: "btn-auth mt-4", style: { background: 'transparent', color: 'var(--ac-gray-40)' }, children: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E" })] }) }));
};
export default Profile;
//# sourceMappingURL=Profile.js.map