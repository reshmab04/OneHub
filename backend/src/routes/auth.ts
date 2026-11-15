import { Router } from 'express';
import { login, register, logout, me, forgotPassword, resetPassword, changePassword } from '../controllers/auth';
import { requireAuth } from '../middleware/auth';
import { authRateLimit, strictAuthRateLimit } from '../middleware/security';

const router = Router();

router.post('/login', authRateLimit, login);
router.post('/register', authRateLimit, register);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.post('/forgot-password', strictAuthRateLimit, forgotPassword);
router.post('/reset-password', strictAuthRateLimit, resetPassword);
router.post('/change-password', requireAuth, changePassword);

export default router;
