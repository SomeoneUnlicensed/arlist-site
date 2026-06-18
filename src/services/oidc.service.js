"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const oidc_provider_1 = require("oidc-provider");
const prisma_service_1 = __importDefault(require("./prisma.service"));
// Basic adapter for oidc-provider using Prisma
// For simplicity in this demo, we can use a more robust adapter in production
// This is a minimal implementation to show the concept
const configuration = {
    clients: [
        // We can seed a default client for testing
        {
            client_id: 'test_client',
            client_secret: 'test_secret',
            redirect_uris: ['http://localhost:3000/callback'],
            grant_types: ['authorization_code'],
        },
    ],
    interactions: {
        url(ctx, interaction) {
            return `/interaction/${interaction.uid}`;
        },
    },
    cookies: {
        keys: [process.env.OIDC_COOKIE_KEY || 'oidc-cookie-secret'],
    },
    findAccount: async (ctx, id) => {
        const user = await prisma_service_1.default.user.findUnique({ where: { id } });
        if (!user)
            return undefined;
        return {
            accountId: id,
            claims: async (use, scope) => ({
                sub: id,
                email: user.email,
                name: user.name,
            }),
        };
    },
    claims: {
        openid: ['sub'],
        email: ['email'],
        profile: ['name'],
    },
    features: {
        devInteractions: { enabled: false }, // We use our own interactions
    },
};
const oidcProvider = new oidc_provider_1.Provider(process.env.ISSUER_URL || 'http://localhost:8086', configuration);
exports.default = oidcProvider;
//# sourceMappingURL=oidc.service.js.map