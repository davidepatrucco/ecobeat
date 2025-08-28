import { Request, Response, NextFunction } from 'express';
// import { User } from '../models/User'; // Not used in rate limiting logic
import { EmailToken } from '../models/EmailToken';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message: string; // Error message when rate limit exceeded
  skipSuccessfulRequests?: boolean; // Whether to skip counting successful requests
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

// In-memory rate limiting store (for simple implementation)
// In production, you might want to use Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Generic rate limiting middleware
 */
export const createRateLimit = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = getKeyForRequest(req);
    const now = Date.now();

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      // 1% chance to cleanup
      cleanupExpiredEntries(now);
    }

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
        lastRequest: now,
      };
      rateLimitStore.set(key, entry);
      next();
      return;
    }

    // Check if rate limit exceeded
    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      res.status(429).json({
        error: 'Too Many Requests',
        message: config.message,
        retryAfter,
        resetTime: new Date(entry.resetTime).toISOString(),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Increment counter
    entry.count++;
    entry.lastRequest = now;
    rateLimitStore.set(key, entry);

    next();
  };
};

/**
 * Rate limiting specifically for email sending
 */
export const emailRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 3, // 3 emails per 15 minutes per user
  message:
    'Too many email requests. Please wait before requesting another email.',
});

/**
 * Rate limiting for password reset requests
 */
export const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 password reset requests per hour per IP/email
  message: 'Too many password reset requests. Please wait before trying again.',
});

/**
 * Rate limiting for login attempts
 */
export const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 login attempts per 15 minutes per IP
  message: 'Too many login attempts. Please wait before trying again.',
});

/**
 * Rate limiting for registration
 */
export const registrationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 registrations per hour per IP
  message: 'Too many registration attempts. Please wait before trying again.',
});

/**
 * Database-based rate limiting for email verification specifically
 * This checks actual email tokens in the database to prevent abuse
 */
export const emailVerificationRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check how many verification emails sent in last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTokens = await EmailToken.countDocuments({
      userId: user._id,
      type: 'email_verification',
      createdAt: { $gte: last24Hours },
    });

    if (recentTokens >= 5) {
      // Max 5 verification emails per 24 hours
      res.status(429).json({
        error: 'Too Many Requests',
        message:
          'Too many verification emails sent. Please check your email or wait 24 hours.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if last email was sent less than 5 minutes ago
    const lastToken = await EmailToken.findOne({
      userId: user._id,
      type: 'email_verification',
    }).sort({ createdAt: -1 });

    if (lastToken) {
      const timeSinceLastEmail = Date.now() - lastToken.createdAt.getTime();
      const minWaitTime = 5 * 60 * 1000; // 5 minutes

      if (timeSinceLastEmail < minWaitTime) {
        const waitTime = Math.ceil((minWaitTime - timeSinceLastEmail) / 1000);
        res.status(429).json({
          error: 'Too Many Requests',
          message: `Please wait ${waitTime} seconds before requesting another verification email.`,
          retryAfter: waitTime,
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('Email verification rate limit error:', error);
    next(); // Continue on error to avoid blocking legitimate requests
  }
};

/**
 * Get rate limiting key for request (user ID if authenticated, otherwise IP)
 */
function getKeyForRequest(req: Request): string {
  const user = (req as any).user;
  if (user) {
    return `user:${user._id}`;
  }

  // Use IP address as fallback
  const ip =
    req.ip ||
    req.connection.remoteAddress ||
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get current rate limit status for a request
 */
export const getRateLimitStatus = (
  req: Request,
  config: RateLimitConfig
): {
  remaining: number;
  resetTime: number;
  total: number;
} => {
  const key = getKeyForRequest(req);
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    return {
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
      total: config.maxRequests,
    };
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
    total: config.maxRequests,
  };
};
