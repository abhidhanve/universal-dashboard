/**
 * Authentication Service
 * Handles business logic for developer authentication
 */
import jwt, { SignOptions } from 'jsonwebtoken';
import { authDb } from '../auth/database';
import { PasswordUtils } from '../utils/passwordUtils';
import { ValidationUtils } from '../utils/validation';
import { ApiKeyGenerator } from '../utils/apiKeyGenerator';
import type { Developer } from '../auth/database';

export interface RegisterDeveloperData {
  name: string;
  email: string;
  password: string;
  company?: string;
  tier?: 'free' | 'premium' | 'enterprise';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  developer: Omit<Developer, 'password'>;
  token: string;
  expiresIn: string;
}

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * Register a new developer
   */
  async registerDeveloper(data: RegisterDeveloperData): Promise<AuthResult> {
    // Validate input
    const validation = ValidationUtils.validateRequired(data, ['name', 'email', 'password']);
    if (!validation.isValid) {
      throw new Error(`Missing required fields: ${validation.missingFields.join(', ')}`);
    }

    // Validate email format
    if (!ValidationUtils.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = PasswordUtils.validateStrength(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if developer already exists
    const existingDeveloper = await authDb.getDeveloperByEmail(data.email);
    if (existingDeveloper) {
      throw new Error('Developer with this email already exists');
    }

    // Sanitize input
    const sanitizedData = {
      name: ValidationUtils.sanitizeString(data.name, 100),
      email: data.email.toLowerCase().trim(),
      password: data.password,
      company: data.company ? ValidationUtils.sanitizeString(data.company, 100) : undefined,
      tier: data.tier || 'free' as const
    };

    // Create developer
    const developer = await authDb.createDeveloper(sanitizedData);

    // Generate JWT token
    const token = this.generateToken(developer);

    return {
      developer: this.sanitizeDeveloper(developer),
      token,
      expiresIn: this.JWT_EXPIRES_IN
    };
  }

  /**
   * Login developer
   */
  async loginDeveloper(credentials: LoginCredentials): Promise<AuthResult> {
    // Validate input
    const validation = ValidationUtils.validateRequired(credentials, ['email', 'password']);
    if (!validation.isValid) {
      throw new Error(`Missing credentials: ${validation.missingFields.join(', ')}`);
    }

    // Find developer
    const developer = await authDb.getDeveloperByEmail(credentials.email.toLowerCase().trim());
    if (!developer) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await PasswordUtils.compare(credentials.password, developer.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if verified (in production)
    if (!developer.verified && process.env.NODE_ENV === 'production') {
      throw new Error('Account not verified. Please check your email for verification instructions.');
    }

    // Update last login
    await authDb.updateDeveloperLogin(developer.id);

    // Generate JWT token
    const token = this.generateToken(developer);

    return {
      developer: this.sanitizeDeveloper(developer),
      token,
      expiresIn: this.JWT_EXPIRES_IN
    };
  }

  /**
   * Verify developer account
   */
  async verifyDeveloper(developerId: string): Promise<Developer> {
    if (!ValidationUtils.isValidUUID(developerId)) {
      throw new Error('Invalid developer ID format');
    }

    const developer = await authDb.getDeveloperById(developerId);
    if (!developer) {
      throw new Error('Developer not found');
    }

    if (developer.verified) {
      throw new Error('Developer account is already verified');
    }

    await authDb.verifyDeveloper(developerId);
    
    return {
      ...developer,
      verified: true
    };
  }

  /**
   * Get developer profile
   */
  async getDeveloperProfile(developerId: string): Promise<Omit<Developer, 'password'>> {
    if (!ValidationUtils.isValidUUID(developerId)) {
      throw new Error('Invalid developer ID format');
    }

    const developer = await authDb.getDeveloperById(developerId);
    if (!developer) {
      throw new Error('Developer not found');
    }

    return this.sanitizeDeveloper(developer);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { developerId: string; email: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      return {
        developerId: decoded.developerId,
        email: decoded.email
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Update developer profile
   */
  async updateProfile(developerId: string, updateData: { name: string }): Promise<Omit<Developer, 'password'>> {
    // Get the developer first to ensure it exists
    const developer = await authDb.getDeveloperById(developerId);
    if (!developer) {
      throw new Error('Developer not found');
    }

    // Update the profile
    const updatedDeveloper = await authDb.updateDeveloper(developerId, {
      name: updateData.name
    });

    if (!updatedDeveloper) {
      throw new Error('Failed to update developer profile');
    }

    return this.sanitizeDeveloper(updatedDeveloper);
  }

  /**
   * Generate JWT token
   */
  private generateToken(developer: Developer): string {
    return jwt.sign(
      {
        developerId: developer.id,
        email: developer.email
      },
      this.JWT_SECRET,
      { 
        expiresIn: '7d'  // Use string literal instead
      }
    );
  }

  /**
   * Remove password from developer object
   */
  private sanitizeDeveloper(developer: Developer): Omit<Developer, 'password'> {
    const { password, ...sanitized } = developer;
    return sanitized;
  }
}
