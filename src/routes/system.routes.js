import { Router } from 'express';
import systemController from '#controllers/system.controller.js';

const router = Router();

router.get('/', systemController.self);
router.get('/health', systemController.health);

export default router;
