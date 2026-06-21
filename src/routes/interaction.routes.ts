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
      // Auto-accept: grant whatever scopes/claims the client requested.
      // Without persisting an actual Grant, oidc-provider's op_scopes_missing
      // check never sees the scopes as "encountered" and re-prompts forever,
      // producing an infinite /interaction <-> /auth redirect loop.
      const grant = details.grantId
        ? await oidcProvider.Grant.find(details.grantId)
        : new oidcProvider.Grant({
            accountId: userId!,
            clientId: params.client_id as string,
          });

      if (params.scope) {
        grant!.addOIDCScope(params.scope as string);
      }
      if (params.claims) {
        const parsedClaims = JSON.parse(params.claims as string);
        const claimNames = new Set([
          ...Object.keys(parsedClaims.id_token || {}),
          ...Object.keys(parsedClaims.userinfo || {}),
        ]);
        if (claimNames.size) {
          grant!.addOIDCClaims([...claimNames]);
        }
      }

      const grantId = await grant!.save();

      const result = {
        consent: {
          grantId,
        },
      };
      return await oidcProvider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
    }

    res.status(500).send('Unsupported prompt');
  } catch (err: any) {
    // SessionNotFound happens when this interaction was already completed (e.g. the
    // browser resubmitted an old /login page after going back, or the user double
    // clicked "Войти"). The interaction record is gone, so we cannot resume the
    // original OAuth flow — send the user back to start a fresh login instead of a
    // bare 500.
    if (err?.name === 'SessionNotFound') {
      res.status(400).send(
        '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">' +
        '<title>Сессия входа устарела — Arlist ID</title></head><body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#222">' +
        '<h2>Сессия входа устарела</h2>' +
        '<p>Похоже, эта попытка входа уже была завершена или истекла (например, из-за повторной отправки формы логина).</p>' +
        '<p>Вернитесь на сайт сервиса, через который вы заходили, и попробуйте войти ещё раз.</p>' +
        '</body></html>'
      );
      return;
    }
    console.error(err);
    res.status(500).send('Internal Error');
  }
});

export default router;
