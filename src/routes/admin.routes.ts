import { Router } from 'express';
import {
  getStats, getClients, createClient, deleteClient,
  getUsers, deleteUser, updateUser, getSystemLogs,
  getSystemSettings, updateSystemSettings, sendMailBroadcast,
  getTariffs, updateTariff, getKnownModels,
  getAiModels, createAiModel, updateAiModel, deleteAiModel,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  addIncidentUpdate, createMaintenance, createStatusComponent, createStatusIncident,
  deleteMaintenance, deleteStatusComponent, deleteStatusIncident, getAdminStatus,
  updateMaintenance, updateStatusComponent, updateStatusIncident,
  updateStatusPageSettings,
} from '../controllers/status.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/stats', getStats);
router.get('/logs', getSystemLogs);

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

router.get('/models', getAiModels);
router.post('/models', createAiModel);
router.patch('/models/:id', updateAiModel);
router.delete('/models/:id', deleteAiModel);

router.get('/status', getAdminStatus);
router.patch('/status/settings', updateStatusPageSettings);
router.post('/status/components', createStatusComponent);
router.patch('/status/components/:id', updateStatusComponent);
router.delete('/status/components/:id', deleteStatusComponent);
router.post('/status/incidents', createStatusIncident);
router.patch('/status/incidents/:id', updateStatusIncident);
router.post('/status/incidents/:id/updates', addIncidentUpdate);
router.delete('/status/incidents/:id', deleteStatusIncident);
router.post('/status/maintenance', createMaintenance);
router.patch('/status/maintenance/:id', updateMaintenance);
router.delete('/status/maintenance/:id', deleteMaintenance);

export default router;
