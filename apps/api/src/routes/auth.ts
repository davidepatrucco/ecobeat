import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { AuthService } from '../services/auth';
import { DatabaseService } from '../services/database';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { loginRateLimit, registrationRateLimit } from '../middleware/rateLimit';

export const authRouter = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /auth/register - Register new user
 */
authRouter.post(
  '/register',
  registrationRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure database is connected
      const db = DatabaseService.getInstance();
      await db.connect();

      // Validate input
      const validationResult = registerSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { email, password, firstName, lastName } = validationResult.data;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({
          error: 'Conflict',
          message: 'User with this email already exists',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate password strength
      const authService = AuthService.getInstance();
      const passwordValidation = authService.validatePassword(password);

      if (!passwordValidation.isValid) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Hash password
      const passwordHash = await authService.hashPassword(password);

      // Create user
      const user = new User({
        email,
        passwordHash,
        firstName,
        lastName,
        isEmailVerified: false,
        profile: {
          sustainabilityGoals: [],
          preferences: {
            notifications: true,
            theme: 'auto',
            language: 'en',
          },
        },
      });

      await user.save();

      // Generate tokens
      const tokens = await authService.generateTokens(user);

      console.log(`✅ User registered: ${email}`);

      res.status(201).json({
        message: 'User registered successfully',
        user: user.toJSON(), // This excludes passwordHash due to schema transform
        tokens,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to register user',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * POST /auth/login - User login
 */
authRouter.post(
  '/login',
  loginRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure database is connected
      const db = DatabaseService.getInstance();
      await db.connect();

      // Validate input
      const validationResult = loginSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { email, password } = validationResult.data;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Verify password
      const authService = AuthService.getInstance();
      const isPasswordValid = await authService.verifyPassword(
        password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Generate tokens
      const tokens = await authService.generateTokens(user);

      console.log(`✅ User logged in: ${email}`);

      res.status(200).json({
        message: 'Login successful',
        user: user.toJSON(),
        tokens,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to login',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * POST /auth/refresh - Refresh access token
 */
authRouter.post(
  '/refresh',
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure database is connected
      const db = DatabaseService.getInstance();
      await db.connect();

      // Validate input
      const validationResult = refreshSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { refreshToken } = validationResult.data;

      // Use the auth service to refresh the access token
      const authService = AuthService.getInstance();
      const tokens = await authService.refreshAccessToken(refreshToken);

      if (!tokens) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      console.log(`✅ Token refreshed successfully`);

      res.status(200).json({
        message: 'Tokens refreshed successfully',
        tokens,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        error: 'Unauthorized',
        message:
          error instanceof Error
            ? error.message
            : 'Invalid or expired refresh token',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /auth/me - Get current user info (protected)
 */
authRouter.get('/me', authenticateJWT, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  try {
    res.status(200).json({
      message: 'User info retrieved successfully',
      user: authReq.user.toJSON(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user info',
      timestamp: new Date().toISOString(),
    });
  }
});

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
  logoutAll: z.boolean().optional().default(false),
});

/**
 * POST /auth/logout - Logout user (protected)
 */
authRouter.post('/logout', authenticateJWT, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  try {
    // Ensure database is connected
    const db = DatabaseService.getInstance();
    await db.connect();

    // Validate input
    const validationResult = logoutSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: validationResult.error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { refreshToken, logoutAll } = validationResult.data;
    const authService = AuthService.getInstance();

    if (logoutAll) {
      // Revoke all refresh tokens for this user
      await authService.revokeAllRefreshTokens(
        (authReq.user._id as any).toString(),
        'logout_all'
      );
      console.log(`✅ User logged out from all devices: ${authReq.user.email}`);
    } else if (refreshToken) {
      // Revoke specific refresh token
      await authService.revokeRefreshToken(refreshToken, 'logout');
      console.log(`✅ User logged out from device: ${authReq.user.email}`);
    } else {
      console.log(
        `✅ User logged out (client-side only): ${authReq.user.email}`
      );
    }

    res.status(200).json({
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to logout',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /auth/revoke-all - Revoke all refresh tokens for user (protected)
 */
authRouter.post(
  '/revoke-all',
  authenticateJWT,
  async (req, res): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    try {
      // Ensure database is connected
      const db = DatabaseService.getInstance();
      await db.connect();

      const authService = AuthService.getInstance();
      await authService.revokeAllRefreshTokens(
        (authReq.user._id as any).toString(),
        'security'
      );

      console.log(`✅ All tokens revoked for user: ${authReq.user.email}`);

      res.status(200).json({
        message: 'All refresh tokens revoked successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Revoke all tokens error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to revoke tokens',
        timestamp: new Date().toISOString(),
      });
    }
  }
);
