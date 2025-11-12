import { Router } from 'express';
import systemController from '#controllers/system.controller.js';
import { protect } from '#middleware/auth.middleware.js';

const router = Router();

router.get('/', systemController.self);
router.get('/health', systemController.health);
// Admin dashboard counts (protected)
router.get('/dashboard/count', protect, systemController.getAdminCounts);

export default router;
