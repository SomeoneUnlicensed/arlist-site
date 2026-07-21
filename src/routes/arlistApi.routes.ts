import { Router } from 'express';
import { getUserById, getUserByEmail } from '../controllers/arlistApi.controller.js';
import { authenticateClient } from '../middleware/apiClient.middleware.js';

const router = Router();

router.get('/users/by-email/:email', authenticateClient, getUserByEmail);
router.get('/users/:id', authenticateClient, getUserById);

export default router;
