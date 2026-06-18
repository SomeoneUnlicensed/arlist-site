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

// Dynamically fetch clients from the database
const originalFind = oidcProvider.Client.find.bind(oidcProvider.Client);
oidcProvider.Client.find = async (id: string) => {
  const dbClient = await prisma.oAuthClient.findUnique({ where: { clientId: id } });
  if (dbClient) {
    // Return a client instance
    // Note: We use the existing class to construct it
    const clientConf = {
      client_id: dbClient.clientId,
      client_secret: dbClient.clientSecret,
      redirect_uris: dbClient.redirectUris,
      grant_types: ['authorization_code'],
      response_types: ['code'],
    };
    // Need to cast to any to instantiate because TypeScript might complain, 
    // but oidcProvider.Client constructor expects metadata.
    return new (oidcProvider.Client as any)(clientConf);
  }
  return originalFind(id);
};

export default oidcProvider;
