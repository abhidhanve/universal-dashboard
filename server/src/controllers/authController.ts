/**
 * Auth Controller
 * Handles HTTP requests for authentication endpoints
 */
import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ResponseFormatter } from '../utils/responseFormatter';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new developer
   * POST /auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, company } = req.body;

      const result = await this.authService.registerDeveloper({
        name,
        email,
        password,
        company,
        tier: 'free'
      });

      const response = ResponseFormatter.success(result, 'Developer registered successfully');
      res.status(201).json(response);

    } catch (error) {
      const response = ResponseFormatter.error(
        error instanceof Error ? error.message : 'Registration failed',
        'REGISTRATION_ERROR'
      );
      res.status(400).json(response);
    }
  }

  /**
   * Login developer
   * POST /auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await this.authService.loginDeveloper({ email, password });

      const response = ResponseFormatter.success(result, 'Login successful');
      res.json(response);

    } catch (error) {
      const response = ResponseFormatter.error(
        error instanceof Error ? error.message : 'Login failed',
        'LOGIN_ERROR'
      );
      res.status(401).json(response);
    }
  }

  /**
   * Verify developer account
   * POST /auth/verify/:developerId
   */
  async verify(req: Request, res: Response): Promise<void> {
    try {
      const { developerId } = req.params;

      const developer = await this.authService.verifyDeveloper(developerId);

      const response = ResponseFormatter.success(
        {
          developer: {
            id: developer.id,
            name: developer.name,
            email: developer.email,
            verified: developer.verified
          }
        },
        'Developer account verified successfully'
      );
      res.json(response);

    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        const response = ResponseFormatter.error(error.message, 'DEVELOPER_NOT_FOUND');
        res.status(404).json(response);
      } else if (error instanceof Error && error.message.includes('already verified')) {
        const response = ResponseFormatter.error(error.message, 'ALREADY_VERIFIED');
        res.status(400).json(response);
      } else {
        const response = ResponseFormatter.error(
          error instanceof Error ? error.message : 'Verification failed',
          'VERIFICATION_ERROR'
        );
        res.status(500).json(response);
      }
    }
  }

  /**
   * Get developer profile
   * GET /auth/profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const developer = req.developer;
      if (!developer) {
        const response = ResponseFormatter.error('Developer not found', 'DEVELOPER_NOT_FOUND');
        res.status(404).json(response);
        return;
      }

      const response = ResponseFormatter.success({ developer }, 'Profile retrieved successfully');
      res.json(response);

    } catch (error) {
      const response = ResponseFormatter.error(
        error instanceof Error ? error.message : 'Failed to get profile',
        'PROFILE_ERROR'
      );
      res.status(500).json(response);
    }
  }

  /**
   * Update developer profile
   * PUT /auth/profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const developer = req.developer;
      if (!developer) {
        const response = ResponseFormatter.error('Developer not found', 'DEVELOPER_NOT_FOUND');
        res.status(404).json(response);
        return;
      }

      const { name } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        const response = ResponseFormatter.error('Name is required', 'VALIDATION_ERROR');
        res.status(400).json(response);
        return;
      }

      const updatedDeveloper = await this.authService.updateProfile(developer.id, {
        name: name.trim()
      });

      const response = ResponseFormatter.success({ developer: updatedDeveloper }, 'Profile updated successfully');
      res.json(response);

    } catch (error) {
      const response = ResponseFormatter.error(
        error instanceof Error ? error.message : 'Failed to update profile',
        'PROFILE_UPDATE_ERROR'
      );
      res.status(500).json(response);
    }
  }
}
