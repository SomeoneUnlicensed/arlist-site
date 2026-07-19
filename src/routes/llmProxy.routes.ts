import { Router } from 'express';
import { chatCompletions, listModels } from '../controllers/llmProxy.controller.js';
import { authenticateApiKey } from '../middleware/apiKey.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.use(authenticateApiKey);
router.use(rateLimit);

router.post('/chat/completions', chatCompletions);
router.get('/models', listModels);

export default router;
