import { Router } from 'express';

import { getHealthStatus } from '../controllers/health.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/health', asyncHandler(getHealthStatus));

export default router;
