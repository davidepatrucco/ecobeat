import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { User, IUser } from '../models/User';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user: IUser;
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header missing',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token missing in Authorization header',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify token
    const authService = AuthService.getInstance();
    const decoded = await authService.verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT authentication failed:', error);

    let message = 'Invalid or expired token';
    if (error instanceof Error) {
      message = error.message;
    }

    res.status(401).json({
      error: 'Unauthorized',
      message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Optional JWT middleware - doesn't fail if no token provided
 */
export const optionalJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const authService = AuthService.getInstance();
    const decoded = await authService.verifyToken(token);

    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    console.warn('Optional JWT failed:', error);
    next();
  }
};

/**
 * Middleware to check if user is email verified
 */
export const requireEmailVerified = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user.isEmailVerified) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Email verification required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};
