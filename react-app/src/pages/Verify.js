import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
const Verify = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('/api/auth/verify', { email, code });
            navigate('/auth/login?verified=true');
        }
        catch (err) {
            setError(err.response?.data?.error || 'Verification failed');
        }
    };
    return (_jsx("div", { className: "auth-container", children: _jsxs("div", { className: "auth-card", children: [_jsx("h1", { className: "auth-title", children: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435" }), _jsxs("p", { className: "auth-subtitle", children: ["\u0412\u0432\u0435\u0434\u0438\u0442\u0435 6-\u0437\u043D\u0430\u0447\u043D\u044B\u0439 \u043A\u043E\u0434, \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0439 \u043D\u0430 ", email, "."] }), error && _jsx("div", { className: "text-red-500 text-sm mb-4", children: error }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u041A\u043E\u0434 \u0438\u0437 \u043F\u0438\u0441\u044C\u043C\u0430" }), _jsx("input", { type: "text", className: "form-input", value: code, onChange: (e) => setCode(e.target.value), placeholder: "123456", required: true })] }), _jsx("button", { type: "submit", className: "btn-auth", children: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C" })] })] }) }));
};
export default Verify;
//# sourceMappingURL=Verify.js.map