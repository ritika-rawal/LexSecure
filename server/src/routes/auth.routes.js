import { Router } from 'express';

import { registerUser } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { registerValidator } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', registerValidator, validateRequest, asyncHandler(registerUser));

export default router;
