import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('/api/auth/login', { email, password });
            const returnTo = searchParams.get('return_to');
            if (returnTo) {
                window.location.href = returnTo;
            }
            else {
                navigate('/profile');
            }
        }
        catch (err) {
            setError(err.response?.data?.error || 'Failed to login');
        }
    };
    return (_jsx("div", { className: "auth-container", children: _jsxs("div", { className: "auth-card", children: [_jsx("h1", { className: "auth-title", children: "\u0412\u0445\u043E\u0434" }), _jsx("p", { className: "auth-subtitle", children: "Arlist ID \u2014 \u0435\u0434\u0438\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 \u043A \u0432\u0430\u0448\u0438\u043C \u0441\u0435\u0440\u0432\u0438\u0441\u0430\u043C." }), error && _jsx("div", { className: "text-red-500 text-sm mb-4", children: error }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Email" }), _jsx("input", { type: "email", className: "form-input", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u041F\u0430\u0440\u043E\u043B\u044C" }), _jsx("input", { type: "password", className: "form-input", value: password, onChange: (e) => setPassword(e.target.value), required: true })] }), _jsx("button", { type: "submit", className: "btn-auth", children: "\u0412\u043E\u0439\u0442\u0438" })] }), _jsxs("div", { className: "auth-footer", children: ["\u041D\u0435\u0442 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430? ", _jsx(Link, { to: "/auth/register", className: "auth-link", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }) }));
};
export default Login;
//# sourceMappingURL=Login.js.map