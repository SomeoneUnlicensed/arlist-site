import { Provider, Configuration } from 'oidc-provider';
import prisma from './prisma.service.js';
import { PrismaAdapter } from './oidc-adapter.js';


const jwks = process.env.OIDC_JWKS
  ? JSON.parse(process.env.OIDC_JWKS)
  : undefined;

const configuration: Configuration = {
  adapter: PrismaAdapter,
  ...(jwks ? { jwks } : {}),
  clients: [],
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
    
    // Check if the client requesting authentication is an internal trusted app
    const clientId = ctx.oidc.client?.clientId;
    let isTrusted = false;
    if (clientId) {
      const client = await prisma.oAuthClient.findUnique({ where: { clientId } });
      if (client && client.isTrusted) {
        isTrusted = true;
      }
    }

    return {
      accountId: id,
      claims: async (use, scope) => {
        const claims: any = {
          sub: id,
          email: user.email,
          name: user.name,
        };
        // If the application is our internal trusted app, we pass extended data like role
        if (isTrusted) {
          claims.role = user.role;
          claims.isVerified = user.isVerified;
        }
        return claims;
      },
    };
  },
  claims: {
    openid: ['sub'],
    email: ['email'],
    profile: ['name'],
    // Custom scope 'internal' for trusted apps to request extended data
    internal: ['role', 'isVerified'],
  },
  features: {
    devInteractions: { enabled: false },
  },
};

const oidcProvider = new Provider(process.env.ISSUER_URL || 'http://localhost:8086', configuration);
// Trust X-Forwarded-Proto from nginx so discovery URLs use https://
oidcProvider.proxy = true;

export default oidcProvider;
