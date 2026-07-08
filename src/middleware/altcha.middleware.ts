import { NextFunction, Request, Response } from 'express';
import { verifyAltchaPayload } from '../services/altcha.service.js';

export async function requireAltcha(req: Request, res: Response, next: NextFunction) {
  try {
    const ok = await verifyAltchaPayload(req.body?.captcha);
    if (!ok) {
      return res.status(403).json({
        error: 'Не пройдена антибот-проверка. Обновите страницу и попробуйте снова.',
      });
    }

    next();
  } catch (error) {
    console.error('ALTCHA verification failed:', error);
    res.status(500).json({ error: 'Ошибка антибот-проверки' });
  }
}
