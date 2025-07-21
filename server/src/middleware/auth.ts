import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authDb, Developer, Client } from '../auth/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Extend Express Request to include our custom properties
declare global {
  namespace Express {
    interface Request {
      developer?: Developer;
      client?: Client;
      startTime?: number;
    }
  }
}

// JWT authentication middleware for developers
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: 'Authorization token required',
      message: 'Please provide a valid Bearer token'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { developerId: string, email: string };
    
    const developer = await authDb.getDeveloperById(decoded.developerId);

    if (!developer) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Developer account not found'
      });
    }

    // For testing purposes, allow unverified developers
    // if (!developer.verified) {
    //   return res.status(401).json({
    //     error: 'Invalid token', 
    //     message: 'Developer account not verified'
    //   });
    // }

    req.developer = developer;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Please provide a valid authorization token'
    });
  }
};

// API Key authentication middleware for client applications
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid X-API-Key header',
      documentation: 'https://docs.universalpanel.dev/authentication'
    });
  }

  try {
    const client = await authDb.getClientByApiKey(apiKey);

    if (!client) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid or has been revoked'
      });
    }

    if (!client.active) {
      return res.status(403).json({
        error: 'API key disabled',
        message: 'This API key has been disabled. Contact the developer for assistance'
      });
    }

    // Check rate limiting
    const usage = await authDb.getUsageStats(client.id, 'hour');
    
    const rateLimits = {
      free: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
      premium: parseInt(process.env.RATE_LIMIT_PREMIUM_MAX || '10000'),
      enterprise: 100000
    };

    const currentLimit = rateLimits[client.rateLimitTier];
    
    if (usage && usage.total_requests >= currentLimit) {
      const now = new Date();
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded the ${currentLimit} requests per hour limit for ${client.rateLimitTier} tier`,
        current: usage.total_requests,
        limit: currentLimit,
        resetTime: new Date(Math.ceil(now.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000)).toISOString()
      });
    }

    // Store client info and start time for usage tracking
    req.client = client;
    req.startTime = Date.now();
    
    // Update client usage
    await authDb.updateClientUsage(client.id);

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      error: 'Authentication service error',
      message: 'Failed to authenticate API key'
    });
  }
};

// Permission checking middleware
export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const client = req.client;

    if (!client) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'This endpoint requires API key authentication'
      });
    }

    const hasPermission = requiredPermissions.some(permission => 
      client.permissions.includes(permission) || client.permissions.includes('admin')
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This operation requires one of: ${requiredPermissions.join(', ')}`,
        current: client.permissions
      });
    }

    next();
  };
};

// Usage tracking middleware (to be used after response)
export const trackApiUsage = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    if (req.client && req.startTime) {
      const responseTime = Date.now() - req.startTime;
      
      // Log the API usage
      authDb.logApiUsage({
        clientId: req.client.id,
        endpoint: req.path,
        method: req.method,
        responseStatus: res.statusCode,
        responseTime: responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Development mode bypass (when ENABLE_AUTH=false)
export const bypassAuthInDev = (req: Request, res: Response, next: NextFunction) => {
  const authEnabled = process.env.ENABLE_AUTH !== 'false';
  
  if (!authEnabled && process.env.NODE_ENV === 'development') {
    // Create a mock client and developer for development
    req.client = {
      id: 'dev-client',
      developerId: 'dev-developer',
      name: 'Development Client',
      apiKey: 'dev-key',
      permissions: ['read', 'write', 'delete', 'admin'],
      active: true,
      rateLimitTier: 'enterprise',
      createdAt: new Date().toISOString(),
      requestCount: 0
    };
    
    req.developer = {
      id: '941dd6b9-014b-47a7-aa6e-c5d9d7f52ae3', // Use real developer ID
      name: 'Development Developer',
      email: 'dev@example.com',
      password: 'dev-password',
      verified: true,
      tier: 'enterprise',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    
    return next();
  }
  
  // In production or when auth is enabled, require real authentication
  return authenticateApiKey(req, res, next);
};

// Middleware to add security headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add API version header
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Method', 'Method 3: Direct Database Connection');
  
  next();
};
