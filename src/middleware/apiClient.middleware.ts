import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service.js';

// Auth for server-to-server Arlist API calls: Authorization: Basic base64(clientId:clientSecret)
export const authenticateClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Missing Basic auth with client_id:client_secret' });
    }

    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const [clientId, clientSecret] = decoded.split(':');
    if (!clientId || !clientSecret) {
      return res.status(401).json({ error: 'Invalid Authorization header' });
    }

    const client = await prisma.oAuthClient.findUnique({ where: { clientId } });
    if (!client || client.clientSecret !== clientSecret) {
      return res.status(401).json({ error: 'Invalid client credentials' });
    }

    (req as any).client = client;
    next();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
