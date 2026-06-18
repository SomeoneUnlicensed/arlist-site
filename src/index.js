"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const interaction_routes_1 = __importDefault(require("./routes/interaction.routes"));
const oidc_service_1 = __importDefault(require("./services/oidc.service"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8086;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Interaction Routes (must be before OIDC provider)
app.use('/interaction', interaction_routes_1.default);
// Auth API Routes
app.use('/api/auth', auth_routes_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
// OIDC Provider
app.use(oidc_service_1.default.callback());
// Serve static files from the 'html' directory
// Put after API/OIDC to avoid conflicts
app.use(express_1.default.static(path_1.default.join(__dirname, '../html')));
// Fallback for SPA (future React app)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/interaction') || req.path.startsWith('/oidc')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path_1.default.join(__dirname, '../html/index.html'));
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`OIDC Issuer: ${process.env.ISSUER_URL || 'http://localhost:8086'}`);
});
//# sourceMappingURL=index.js.map