import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const Admin = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    useEffect(() => {
        // We'll need to implement an admin-only API for this
        const fetchUsers = async () => {
            try {
                // Placeholder API endpoint
                // const res = await axios.get('/api/admin/users');
                // setUsers(res.data);
            }
            catch (err) {
                // navigate('/profile');
            }
        };
        fetchUsers();
    }, [navigate]);
    return (_jsx("div", { className: "auth-container", style: { maxWidth: '800px', margin: '0 auto', display: 'block' }, children: _jsxs("div", { className: "auth-card", style: { maxWidth: 'none' }, children: [_jsx("h1", { className: "auth-title", children: "\u0410\u0434\u043C\u0438\u043D-\u043F\u0430\u043D\u0435\u043B\u044C" }), _jsx("p", { className: "auth-subtitle", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F\u043C\u0438 \u0438 Arlist ID." }), _jsx("div", { className: "mt-8", children: _jsx("p", { className: "text-gray-400", children: "\u0412 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435..." }) }), _jsx("button", { onClick: () => navigate('/profile'), className: "btn-auth mt-8", children: "\u041D\u0430\u0437\u0430\u0434 \u0432 \u043F\u0440\u043E\u0444\u0438\u043B\u044C" })] }) }));
};
export default Admin;
//# sourceMappingURL=Admin.js.map