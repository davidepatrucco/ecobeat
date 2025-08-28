import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { BiometricService } from '../services/biometric';
import { DatabaseService } from '../services/database';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

export const biometricRouter = Router();

// Validation schemas
const registerBiometricSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  credentialId: z.string().min(1, 'Credential ID is required'),
  publicKey: z.string().min(1, 'Public key is required'),
  deviceInfo: z
    .object({
      deviceName: z.string().optional(),
      platform: z.string().optional(),
      userAgent: z.string().optional(),
    })
    .optional(),
});

const createChallengeSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

const verifyBiometricSchema = z.object({
  challenge: z.string().min(1, 'Challenge is required'),
  signature: z.string().min(1, 'Signature is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
});

const revokeBiometricSchema = z.object({
  credentialId: z.string().min(1, 'Credential ID is required'),
});

/**
 * POST /biometric/register - Register biometric credential (protected)
 */
biometricRouter.post(
  '/register',
  authenticateJWT,
  async (req, res): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    try {
      // Ensure database is connected
      const db = DatabaseService.getInstance();
      await db.connect();

      // Validate input
      const validationResult = registerBiometricSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { deviceId, credentialId, publicKey, deviceInfo } =
        validationResult.data;

      // Register biometric credential
      const biometricService = BiometricService.getInstance();
      const result = await biometricService.registerBiometric(
        authReq.user,
        deviceId,
        credentialId,
        publicKey,
        deviceInfo as any
      );

      if (result.success) {
        res.status(200).json({
          message: result.message,
          credentialId: result.credentialId,
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
      console.error('Register biometric error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to register biometric credential',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * POST /biometric/challenge - Create authentication challenge
 */
biometricRouter.post(
  '/challenge',
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate input
      const validationResult = createChallengeSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { deviceId } = validationResult.data;

      // For this endpoint, we need a way to identify the user
      // In a real app, this might come from a previous step or device storage
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'User identification required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create challenge
      const biometricService = BiometricService.getInstance();
      const result = await biometricService.createBiometricChallenge(
        userId,
        deviceId
      );

      if (result.success) {
        res.status(200).json({
          message: result.message,
          challenge: result.challenge,
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
      console.error('Create biometric challenge error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create biometric challenge',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * POST /biometric/verify - Verify biometric authentication
 */
biometricRouter.post(
  '/verify',
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure database is connected
      const db = DatabaseService.getInstance();
      await db.connect();

      // Validate input
      const validationResult = verifyBiometricSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { challenge, signature, deviceId } = validationResult.data;

      // Verify biometric authentication
      const biometricService = BiometricService.getInstance();
      const result = await biometricService.verifyBiometricAuthentication(
        challenge,
        signature,
        deviceId
      );

      if (result.success) {
        res.status(200).json({
          message: result.message,
          user: result.user?.toJSON(),
          tokens: result.tokens,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(401).json({
          error: 'Unauthorized',
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Verify biometric error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify biometric authentication',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /biometric/credentials - Get user's biometric credentials (protected)
 */
biometricRouter.get(
  '/credentials',
  authenticateJWT,
  async (req, res): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    try {
      const biometricService = BiometricService.getInstance();
      const credentials = biometricService.getUserBiometricCredentials(
        (authReq.user._id as any).toString()
      );

      // Remove sensitive data before sending to client
      const safeCredentials = credentials.map(cred => ({
        id: cred.id,
        deviceId: cred.deviceId,
        deviceInfo: cred.deviceInfo,
        createdAt: cred.createdAt,
        lastUsedAt: cred.lastUsedAt,
        isActive: cred.isActive,
      }));

      res.status(200).json({
        message: 'Biometric credentials retrieved successfully',
        credentials: safeCredentials,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get biometric credentials error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get biometric credentials',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * DELETE /biometric/revoke - Revoke biometric credential (protected)
 */
biometricRouter.delete(
  '/revoke',
  authenticateJWT,
  async (req, res): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    try {
      // Validate input
      const validationResult = revokeBiometricSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: validationResult.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { credentialId } = validationResult.data;

      // Revoke biometric credential
      const biometricService = BiometricService.getInstance();
      const result = await biometricService.revokeBiometricCredential(
        (authReq.user._id as any).toString(),
        credentialId
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
      console.error('Revoke biometric error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to revoke biometric credential',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /biometric/status/:deviceId - Check if biometric is enabled for device (protected)
 */
biometricRouter.get(
  '/status/:deviceId',
  authenticateJWT,
  async (req, res): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { deviceId } = req.params;

      if (!deviceId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Device ID is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const biometricService = BiometricService.getInstance();
      const isEnabled = biometricService.hasBiometricEnabled(
        (authReq.user._id as any).toString(),
        deviceId
      );

      res.status(200).json({
        message: 'Biometric status retrieved successfully',
        enabled: isEnabled,
        deviceId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Check biometric status error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check biometric status',
        timestamp: new Date().toISOString(),
      });
    }
  }
);
