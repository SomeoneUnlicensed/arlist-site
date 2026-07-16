import { Router } from 'express';
import { start, poll, confirm, getUsageStats } from '../controllers/cliAuth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/start', start);
router.post('/poll', poll);
router.post('/confirm', authenticate, confirm);

router.get('/usage', authenticate, getUsageStats);

export default router;
