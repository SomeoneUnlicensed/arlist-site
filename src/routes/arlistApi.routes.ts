import { Router } from 'express';
import { getUserById, getUserByEmail } from '../controllers/arlistApi.controller.js';
import { authenticateClient } from '../middleware/apiClient.middleware.js';

const router = Router();

router.use(authenticateClient);

router.get('/users/:id', getUserById);
router.get('/users/by-email/:email', getUserByEmail);

export default router;
