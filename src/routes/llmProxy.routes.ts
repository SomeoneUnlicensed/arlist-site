import { Router } from 'express';
import { chatCompletions, listModels } from '../controllers/llmProxy.controller.js';
import { responses } from '../controllers/responsesApi.controller.js';
import { authenticateApiKey } from '../middleware/apiKey.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.use(authenticateApiKey);

router.get('/models', listModels);
router.post('/chat/completions', rateLimit, chatCompletions);
router.post('/responses', rateLimit, responses);

export default router;
