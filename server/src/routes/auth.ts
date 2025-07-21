/**
 * Updated Authentication Routes using Controllers
 * These routes now use the proper MVC pattern with controllers
 */
import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';
import { ValidationUtils } from '../utils/validation';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();
const authController = new AuthController();

/**
 * Input validation middleware
 */
const validateRegistration = (req: any, res: any, next: any) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json(
      ResponseFormatter.error('Missing required fields: name, email, password', 'VALIDATION_ERROR')
    );
  }

  if (!ValidationUtils.isValidEmail(email)) {
    return res.status(400).json(
      ResponseFormatter.error('Invalid email format', 'INVALID_EMAIL')
    );
  }

  next();
};

const validateLogin = (req: any, res: any, next: any) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json(
      ResponseFormatter.error('Missing required fields: email, password', 'VALIDATION_ERROR')
    );
  }

  next();
};

/**
 * Public routes
 */

// POST /auth/register - Register a new developer
router.post('/register', validateRegistration, async (req, res) => {
  await authController.register(req, res);
});

// POST /auth/login - Login developer
router.post('/login', validateLogin, async (req, res) => {
  await authController.login(req, res);
});

// GET /auth/verify - Verify JWT token
router.get('/verify', authenticateJWT, async (req: any, res: any) => {
  res.json(ResponseFormatter.success({ message: 'Token is valid', user: req.user }));
});

// POST /auth/verify/:developerId - Verify developer account
router.post('/verify/:developerId', async (req, res) => {
  await authController.verify(req, res);
});

/**
 * Protected routes (require JWT authentication)
 */

// GET /auth/profile - Get developer profile
router.get('/profile', authenticateJWT, async (req, res) => {
  await authController.getProfile(req, res);
});

// PUT /auth/profile - Update developer profile
router.put('/profile', authenticateJWT, async (req, res) => {
  await authController.updateProfile(req, res);
});

export default router;
