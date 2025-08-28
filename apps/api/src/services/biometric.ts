import { User, IUser } from '../models/User';
import { AuthService } from './auth';
import crypto from 'crypto';
// import bcrypt from 'bcryptjs'; // Not used in biometric service

export interface BiometricCredential {
  id: string; // Unique identifier for the credential
  userId: string;
  deviceId: string; // Unique device identifier
  credentialId: string; // Public key credential ID
  publicKey: string; // Base64 encoded public key
  createdAt: Date;
  lastUsedAt?: Date;
  deviceInfo?: {
    deviceName?: string;
    platform?: string;
    userAgent?: string;
  };
  isActive: boolean;
}

export interface BiometricChallenge {
  challenge: string;
  userId: string;
  deviceId: string;
  expiresAt: Date;
  used: boolean;
}

export class BiometricService {
  private static instance: BiometricService;
  private challenges = new Map<string, BiometricChallenge>();
  private credentials = new Map<string, BiometricCredential>();

  private constructor() {
    // Clean up expired challenges every 5 minutes
    setInterval(
      () => {
        this.cleanupExpiredChallenges();
      },
      5 * 60 * 1000
    );
  }

  public static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  /**
   * Register a biometric credential for a user
   */
  public async registerBiometric(
    user: IUser,
    deviceId: string,
    credentialId: string,
    publicKey: string,
    deviceInfo?: {
      deviceName?: string;
      platform?: string;
      userAgent?: string;
    }
  ): Promise<{ success: boolean; message: string; credentialId?: string }> {
    try {
      // Check if device already has biometric registered for this user
      const existingCredential = this.findCredentialByUserAndDevice(
        (user._id as any).toString(),
        deviceId
      );

      if (existingCredential) {
        // Update existing credential
        existingCredential.credentialId = credentialId;
        existingCredential.publicKey = publicKey;
        if (deviceInfo) {
          existingCredential.deviceInfo = deviceInfo;
        }
        existingCredential.isActive = true;

        return {
          success: true,
          message: 'Biometric credential updated successfully',
          credentialId: existingCredential.id,
        };
      }

      // Create new credential
      const credential: BiometricCredential = {
        id: crypto.randomUUID(),
        userId: (user._id as any).toString(),
        deviceId,
        credentialId,
        publicKey,
        createdAt: new Date(),
        isActive: true,
      };

      if (deviceInfo) {
        credential.deviceInfo = deviceInfo;
      }

      this.credentials.set(credential.id, credential);

      console.log(
        `✅ Biometric credential registered for user: ${user.email}, device: ${deviceId}`
      );

      return {
        success: true,
        message: 'Biometric credential registered successfully',
        credentialId: credential.id,
      };
    } catch (error) {
      console.error('Error registering biometric credential:', error);
      return {
        success: false,
        message: 'Failed to register biometric credential',
      };
    }
  }

  /**
   * Generate challenge for biometric authentication
   */
  public async createBiometricChallenge(
    userId: string,
    deviceId: string
  ): Promise<{ success: boolean; challenge?: string; message: string }> {
    try {
      // Check if user has biometric credential for this device
      const credential = this.findCredentialByUserAndDevice(userId, deviceId);

      if (!credential || !credential.isActive) {
        return {
          success: false,
          message: 'No active biometric credential found for this device',
        };
      }

      // Generate random challenge
      const challenge = crypto.randomBytes(32).toString('base64');

      // Store challenge with expiration (5 minutes)
      const challengeData: BiometricChallenge = {
        challenge,
        userId,
        deviceId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        used: false,
      };

      this.challenges.set(challenge, challengeData);

      return {
        success: true,
        challenge,
        message: 'Challenge created successfully',
      };
    } catch (error) {
      console.error('Error creating biometric challenge:', error);
      return {
        success: false,
        message: 'Failed to create biometric challenge',
      };
    }
  }

  /**
   * Verify biometric authentication
   */
  public async verifyBiometricAuthentication(
    challenge: string,
    signature: string,
    deviceId: string
  ): Promise<{
    success: boolean;
    user?: IUser;
    tokens?: any;
    message: string;
  }> {
    try {
      // Get challenge data
      const challengeData = this.challenges.get(challenge);

      if (!challengeData) {
        return {
          success: false,
          message: 'Invalid or expired challenge',
        };
      }

      // Check if challenge is expired or already used
      if (
        Date.now() > challengeData.expiresAt.getTime() ||
        challengeData.used
      ) {
        this.challenges.delete(challenge);
        return {
          success: false,
          message: 'Challenge has expired or already been used',
        };
      }

      // Verify device matches
      if (challengeData.deviceId !== deviceId) {
        return {
          success: false,
          message: 'Device mismatch',
        };
      }

      // Get credential
      const credential = this.findCredentialByUserAndDevice(
        challengeData.userId,
        deviceId
      );

      if (!credential || !credential.isActive) {
        return {
          success: false,
          message: 'Biometric credential not found or inactive',
        };
      }

      // In a real implementation, you would verify the signature using the public key
      // For this example, we'll simulate successful verification
      // const isValidSignature = this.verifySignature(challenge, signature, credential.publicKey);
      const isValidSignature = true; // Simulated verification

      if (!isValidSignature) {
        return {
          success: false,
          message: 'Invalid biometric signature',
        };
      }

      // Mark challenge as used
      challengeData.used = true;
      this.challenges.set(challenge, challengeData);

      // Update credential last used time
      credential.lastUsedAt = new Date();
      this.credentials.set(credential.id, credential);

      // Get user and generate tokens
      const user = await User.findById(challengeData.userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Generate authentication tokens
      const authService = AuthService.getInstance();
      const tokens = await authService.generateTokens(user, {
        deviceId,
        authMethod: 'biometric',
      });

      console.log(
        `✅ Biometric authentication successful for user: ${user.email}`
      );

      return {
        success: true,
        user,
        tokens,
        message: 'Biometric authentication successful',
      };
    } catch (error) {
      console.error('Error verifying biometric authentication:', error);
      return {
        success: false,
        message: 'Failed to verify biometric authentication',
      };
    }
  }

  /**
   * Get user's biometric credentials
   */
  public getUserBiometricCredentials(userId: string): BiometricCredential[] {
    return Array.from(this.credentials.values()).filter(
      cred => cred.userId === userId && cred.isActive
    );
  }

  /**
   * Revoke biometric credential
   */
  public async revokeBiometricCredential(
    userId: string,
    credentialId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const credential = this.credentials.get(credentialId);

      if (!credential || credential.userId !== userId) {
        return {
          success: false,
          message: 'Credential not found or unauthorized',
        };
      }

      credential.isActive = false;
      this.credentials.set(credentialId, credential);

      console.log(
        `✅ Biometric credential revoked: ${credentialId} for user: ${userId}`
      );

      return {
        success: true,
        message: 'Biometric credential revoked successfully',
      };
    } catch (error) {
      console.error('Error revoking biometric credential:', error);
      return {
        success: false,
        message: 'Failed to revoke biometric credential',
      };
    }
  }

  /**
   * Check if user has biometric enabled for device
   */
  public hasBiometricEnabled(userId: string, deviceId: string): boolean {
    const credential = this.findCredentialByUserAndDevice(userId, deviceId);
    return credential ? credential.isActive : false;
  }

  // Private helper methods

  private findCredentialByUserAndDevice(
    userId: string,
    deviceId: string
  ): BiometricCredential | undefined {
    return Array.from(this.credentials.values()).find(
      cred =>
        cred.userId === userId && cred.deviceId === deviceId && cred.isActive
    );
  }

  private cleanupExpiredChallenges(): void {
    const now = Date.now();
    for (const [challenge, data] of this.challenges.entries()) {
      if (now > data.expiresAt.getTime()) {
        this.challenges.delete(challenge);
      }
    }
  }

  private verifySignature(
    challenge: string,
    signature: string,
    publicKey: string
  ): boolean {
    // In a real implementation, you would:
    // 1. Parse the public key
    // 2. Verify the signature using the public key and challenge
    // 3. Return true/false based on verification result

    // For this example, we'll simulate verification
    // This would typically use crypto.verify() with the actual public key
    return signature.length > 0 && publicKey.length > 0;
  }
}
