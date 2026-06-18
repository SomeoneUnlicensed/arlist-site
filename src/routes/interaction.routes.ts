import { Router, Request, Response } from 'express';
import oidcProvider from '../services/oidc.service.js';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma.service.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

router.get('/:uid', async (req: Request, res: Response) => {
  try {
    const details = await oidcProvider.interactionDetails(req, res);
    const { uid, prompt, params } = details;

    // Check if user is logged in via our main auth cookie
    const token = req.cookies.token;
    let userId: string | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
      } catch (e) {
        // invalid token
      }
    }

    if (prompt.name === 'login') {
      if (!userId) {
        // User not logged in, redirect to login page
        // We need to tell the login page where to return after successful login
        return res.redirect(`/login?return_to=${encodeURIComponent(`/interaction/${uid}`)}`);
      }

      // User IS logged in, tell OIDC provider about the session
      const result = {
        login: { accountId: userId },
      };
      return await oidcProvider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
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
      return await oidcProvider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
    }

    res.status(500).send('Unsupported prompt');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Error');
  }
});

export default router;
