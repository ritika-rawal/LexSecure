import { Router } from 'express';

import { getCurrentUser, loginUser, logoutUser, registerUser } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { loginValidator, registerValidator } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', registerValidator, validateRequest, asyncHandler(registerUser));
router.post('/login', loginValidator, validateRequest, asyncHandler(loginUser));
router.post('/logout', asyncHandler(logoutUser));
router.get('/me', asyncHandler(getCurrentUser));

export default router;
