import { Router } from 'express';
import { getClients, createClient } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Only ADMIN role can access these routes
router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/clients', getClients);
router.post('/clients', createClient);

export default router;
