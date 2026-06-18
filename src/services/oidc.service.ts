import { Provider, Configuration } from 'oidc-provider';
import prisma from './prisma.service.js';

// Basic adapter for oidc-provider using Prisma
// For simplicity in this demo, we can use a more robust adapter in production
// This is a minimal implementation to show the concept
const configuration: Configuration = {
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
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return undefined;
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

const oidcProvider = new Provider(process.env.ISSUER_URL || 'http://localhost:8086', configuration);

export default oidcProvider;
