import { Request, Response } from 'express';
import prisma from '../services/prisma.service.js';
import crypto from 'crypto';

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await prisma.oAuthClient.findMany({
      select: {
        id: true,
        clientId: true,
        name: true,
        redirectUris: true,
        isTrusted: true,
        createdAt: true,
      },
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const { name, redirectUris, isTrusted } = req.body;

    if (!name || !redirectUris || !Array.isArray(redirectUris)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const clientId = crypto.randomBytes(16).toString('hex');
    const clientSecret = crypto.randomBytes(32).toString('hex');

    const client = await prisma.oAuthClient.create({
      data: {
        name,
        clientId,
        clientSecret,
        redirectUris,
        isTrusted: Boolean(isTrusted),
      },
    });

    // Provide the secret only once upon creation
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
