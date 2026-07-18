import { Router } from 'express';
import {
  getStats, getClients, createClient, deleteClient,
  getUsers, deleteUser, updateUser,
  getSystemSettings, updateSystemSettings, sendMailBroadcast,
  getTariffs, updateTariff, getKnownModels,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/stats', getStats);

router.get('/clients', getClients);
router.post('/clients', createClient);
router.delete('/clients/:id', deleteClient);

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id', updateUser);

router.get('/settings', getSystemSettings);
router.post('/settings', updateSystemSettings);
router.post('/broadcast', sendMailBroadcast);

router.get('/tariffs', getTariffs);
router.patch('/tariffs/:id', updateTariff);
router.get('/known-models', getKnownModels);

export default router;
