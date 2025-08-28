import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getAppConfig } from '@ecobeat/shared';
import { IUser } from '../models/User';
import { RefreshToken, IRefreshToken } from '../models/RefreshToken';

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private static instance: AuthService;
  private jwtSecret: string | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize auth service with JWT secret from configuration
   */
  public async initialize(): Promise<void> {
    if (!this.jwtSecret) {
      const config = await getAppConfig();
      this.jwtSecret = config.JWT_SECRET;

      if (!this.jwtSecret) {
        throw new Error('JWT_SECRET not found in configuration');
      }
    }
  }

  /**
   * Hash password using bcrypt
   */
  public async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 12;
      const hash = await bcrypt.hash(password, saltRounds);
      return hash;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify password against hash
   */
  public async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Generate JWT access token
   */
  public async generateAccessToken(user: IUser): Promise<string> {
    await this.initialize();

    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: (user._id as any).toString(),
      email: user.email,
    };

    return jwt.sign(payload, this.jwtSecret!, {
      expiresIn: '24h',
      issuer: 'ecobeat-api',
      audience: 'ecobeat-mobile',
    });
  }

  /**
   * Generate refresh token (database-stored)
   */
  public async generateRefreshToken(
    user: IUser,
    deviceInfo?: any
  ): Promise<IRefreshToken> {
    // Generate cryptographically secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);

    // Create refresh token document
    const refreshToken = new RefreshToken({
      token: hashedToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceInfo,
    });

    await refreshToken.save();

    // Return the unhashed token for client storage
    (refreshToken as any).token = token; // Override for return
    return refreshToken;
  }

  /**
   * Generate both access and refresh tokens
   */
  public async generateTokens(
    user: IUser,
    deviceInfo?: any
  ): Promise<AuthTokens> {
    const [accessToken, refreshTokenDoc] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user, deviceInfo),
    ]);

    return {
      accessToken,
      refreshToken: (refreshTokenDoc as any).token, // The unhashed token
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(
    refreshToken: string,
    deviceInfo?: any
  ): Promise<AuthTokens | null> {
    try {
      // Find refresh token in database
      const refreshTokenDocs = await RefreshToken.find({
        isRevoked: false,
      }).populate('userId');

      let validRefreshToken: IRefreshToken | null = null;

      // Check each non-revoked token to find a match
      for (const doc of refreshTokenDocs) {
        const isMatch = await bcrypt.compare(refreshToken, doc.token);
        if (isMatch && doc.isValid) {
          validRefreshToken = doc;
          break;
        }
      }

      if (!validRefreshToken) {
        return null; // Invalid or expired refresh token
      }

      // Update last used timestamp
      validRefreshToken.lastUsedAt = new Date();
      await validRefreshToken.save();

      // Get user
      const user = validRefreshToken.userId as any;
      if (!user) {
        return null;
      }

      // Generate new tokens (refresh token rotation)
      const newTokens = await this.generateTokens(user, deviceInfo);

      // Revoke old refresh token
      await validRefreshToken.revoke('replaced');

      return newTokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Revoke refresh token
   */
  public async revokeRefreshToken(
    refreshToken: string,
    reason = 'logout'
  ): Promise<boolean> {
    try {
      // Find and revoke the refresh token
      const refreshTokenDocs = await RefreshToken.find({ isRevoked: false });

      for (const doc of refreshTokenDocs) {
        const isMatch = await bcrypt.compare(refreshToken, doc.token);
        if (isMatch) {
          await doc.revoke(reason);
          return true;
        }
      }

      return false; // Token not found
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      return false;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  public async revokeAllRefreshTokens(
    userId: string,
    reason = 'logout_all'
  ): Promise<boolean> {
    try {
      await RefreshToken.revokeAllForUser(userId as any, reason);
      return true;
    } catch (error) {
      console.error('Error revoking all refresh tokens:', error);
      return false;
    }
  }

  /**
   * Verify and decode JWT token
   */
  public async verifyToken(token: string): Promise<JWTPayload> {
    await this.initialize();

    try {
      const decoded = jwt.verify(token, this.jwtSecret!, {
        issuer: 'ecobeat-api',
        audience: 'ecobeat-mobile',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  public async verifyRefreshToken(token: string): Promise<{ userId: string }> {
    await this.initialize();

    try {
      const decoded = jwt.verify(token, this.jwtSecret!, {
        issuer: 'ecobeat-api',
        audience: 'ecobeat-mobile',
      }) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return { userId: decoded.userId };
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Validate password strength
   */
  public validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
