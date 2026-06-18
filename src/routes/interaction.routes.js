"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const oidc_service_1 = __importDefault(require("../services/oidc.service"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_service_1 = __importDefault(require("../services/prisma.service"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
router.get('/:uid', async (req, res) => {
    try {
        const details = await oidc_service_1.default.interactionDetails(req, res);
        const { uid, prompt, params } = details;
        // Check if user is logged in via our main auth cookie
        const token = req.cookies.token;
        let userId = null;
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                userId = decoded.userId;
            }
            catch (e) {
                // invalid token
            }
        }
        if (prompt.name === 'login') {
            if (!userId) {
                // User not logged in, redirect to login page
                // We need to tell the login page where to return after successful login
                return res.redirect(`/auth/login?return_to=${encodeURIComponent(`/interaction/${uid}`)}`);
            }
            // User IS logged in, tell OIDC provider about the session
            const result = {
                login: { accountId: userId },
            };
            return await oidc_service_1.default.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        }
        if (prompt.name === 'consent') {
            // Show consent screen (in a real app, this would be a React page)
            // For now, we auto-consent for simplicity or redirect to a React consent page
            // Let's assume we redirect to a React consent page
            // return res.redirect(`/auth/consent?uid=${uid}`);
            // OR just auto-accept for this demo:
            const result = {
                consent: {
                    rejectedScopes: [],
                    rejectedClaims: [],
                },
            };
            return await oidc_service_1.default.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
        }
        res.status(500).send('Unsupported prompt');
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Internal Error');
    }
});
exports.default = router;
//# sourceMappingURL=interaction.routes.js.map