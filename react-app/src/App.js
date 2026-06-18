import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
function App() {
    return (_jsx(Router, { children: _jsx("div", { className: "min-h-screen bg-black text-white font-sans", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/auth/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/auth/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/auth/verify", element: _jsx(Verify, {}) }), _jsx(Route, { path: "/profile", element: _jsx(Profile, {}) }), _jsx(Route, { path: "/admin", element: _jsx(Admin, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/auth/login" }) })] }) }) }));
}
export default App;
//# sourceMappingURL=App.js.map