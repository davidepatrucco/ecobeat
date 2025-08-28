import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { EmailService } from '../services/email';
import { AuthService } from '../services/auth';
import { DatabaseService } from '../services/database';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import {
  emailVerificationRateLimit,
  passwordResetRateLimit,
} from '../middleware/rateLimit';

export const emailRouter = Router();

// Validation schemas
// const sendVerificationSchema = z.object({
//   // No body needed - use authenticated user
// });

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Invalid email format'),
});

const sendPasswordResetSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Invalid email format'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /email/send-verification - Send email verification (protected)
 */
emailRouter.post(
  '/send-verification',
  authenticateJWT,
  emailVerificationRateLimit,
  async (req, res): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    try {
      // Ensure database is connected
      const db = DatabaseService.getInstance();
      await db.connect();

      // Check if email is already verified
      if (authReq.user.isEmailVerified) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Email is already verified',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Get device info
      const deviceInfo: { ipAddress?: string; userAgent?: string } = {};
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      if (ipAddress) deviceInfo.ipAddress = ipAddress;
      if (userAgent) deviceInfo.userAgent = userAgent;

      // Send verification email
      const emailService = EmailService.getInstance();
      const result = await emailService.sendEmailVerification(
        authReq.user,
        deviceInfo
      );

      if (result.success) {
        res.status(200).json({
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(500).json({
          error: 'Internal Server Error',
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Send verification error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send verification email',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * POST /email/verify - Verify email token
 */
emailRouter.post(
  '/verify',
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure database is connected
      const db = DatabaseService.getInstance();
      await db.connect();

      // Validate input
      const validationResult = verifyEmailSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { token, email } = validationResult.data;

      // Verify email
      const emailService = EmailService.getInstance();
      const result = await emailService.verifyEmailToken(token, email);

      if (result.success) {
        res.status(200).json({
          message: result.message,
          user: result.user?.toJSON(),
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(400).json({
          error: 'Bad Request',
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify email',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * POST /email/send-password-reset - Send password reset email
 */
emailRouter.post(
  '/send-password-reset',
  passwordResetRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure database is connected
      const db = DatabaseService.getInstance();
      await db.connect();

      // Validate input
      const validationResult = sendPasswordResetSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { email } = validationResult.data;

      // Get device info
      const deviceInfo: { ipAddress?: string; userAgent?: string } = {};
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      if (ipAddress) deviceInfo.ipAddress = ipAddress;
      if (userAgent) deviceInfo.userAgent = userAgent;

      // Send password reset email
      const emailService = EmailService.getInstance();
      const result = await emailService.sendPasswordReset(email, deviceInfo);

      // Always return success for security (don't reveal if email exists)
      res.status(200).json({
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Send password reset error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send password reset email',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * POST /email/verify-reset-token - Verify password reset token (for frontend validation)
 */
emailRouter.post(
  '/verify-reset-token',
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure database is connected
      const db = DatabaseService.getInstance();
      await db.connect();

      // Validate input
      const { token, email } = req.body;

      if (!token || !email) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Token and email are required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Verify reset token
      const emailService = EmailService.getInstance();
      const result = await emailService.verifyPasswordResetToken(token, email);

      if (result.success) {
        res.status(200).json({
          message: result.message,
          valid: true,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(400).json({
          error: 'Bad Request',
          message: result.message,
          valid: false,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Verify reset token error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify reset token',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * POST /email/reset-password - Complete password reset
 */
emailRouter.post(
  '/reset-password',
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure database is connected
      const db = DatabaseService.getInstance();
      await db.connect();

      // Validate input
      const validationResult = resetPasswordSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { token, email, newPassword } = validationResult.data;

      // Validate password strength
      const authService = AuthService.getInstance();
      const passwordValidation = authService.validatePassword(newPassword);

      if (!passwordValidation.isValid) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Reset password
      const emailService = EmailService.getInstance();
      const result = await emailService.resetPassword(
        token,
        email,
        newPassword
      );

      if (result.success) {
        res.status(200).json({
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(400).json({
          error: 'Bad Request',
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to reset password',
        timestamp: new Date().toISOString(),
      });
    }
  }
);
