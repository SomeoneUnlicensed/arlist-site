import { Router } from 'express';
import { getClients, createClient, getUsers, deleteUser, updateUser } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/clients', getClients);
router.post('/clients', createClient);

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id', updateUser);

export default router;
