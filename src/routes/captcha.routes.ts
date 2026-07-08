import { Router } from 'express';
import { issueAltchaChallenge } from '../services/altcha.service.js';

const router = Router();

router.get('/', async (_req, res) => {
  const challenge = await issueAltchaChallenge();
  res.json(challenge);
});

export default router;
