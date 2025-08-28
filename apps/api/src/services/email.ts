import AWS from 'aws-sdk';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { EmailToken } from '../models/EmailToken';
import { User, IUser } from '../models/User';
// import mongoose from 'mongoose'; // Type only imported, not used directly

export interface EmailConfig {
  fromEmail: string;
  replyToEmail: string;
  baseUrl: string;
}

export interface EmailTemplateContext {
  firstName: string;
  email: string;
  verificationUrl?: string;
  resetUrl?: string;
  appName: string;
}

export class EmailService {
  private static instance: EmailService;
  private ses: AWS.SES;
  private config: EmailConfig;
  private parametersLoaded = false;

  private constructor() {
    // Initialize AWS SES
    const awsConfig: any = {
      region: process.env.AWS_REGION || 'us-east-1',
    };

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      awsConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      awsConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    }

    this.ses = new AWS.SES(awsConfig);

    // Initialize config with defaults
    this.config = {
      fromEmail: process.env.FROM_EMAIL || 'noreply@ecobeat.app',
      replyToEmail: process.env.REPLY_TO_EMAIL || 'support@ecobeat.app',
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    };
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Load configuration from AWS Parameter Store (for Lambda environments)
   */
  private async loadConfigFromParameterStore(): Promise<void> {
    if (this.parametersLoaded || process.env.NODE_ENV === 'development') {
      return; // Skip in development or if already loaded
    }

    try {
      const ssm = new AWS.SSM({
        region: process.env.AWS_REGION || 'us-east-1',
      });

      const stage = process.env.NODE_ENV || 'staging';

      const parameterNames = [
        process.env.FROM_EMAIL_PARAM || `/ecobeat/${stage}/ses/from-email`,
        process.env.REPLY_TO_EMAIL_PARAM ||
          `/ecobeat/${stage}/ses/reply-to-email`,
        process.env.BASE_URL_PARAM || `/ecobeat/${stage}/app/base-url`,
      ];

      const result = await ssm
        .getParameters({
          Names: parameterNames,
          WithDecryption: true,
        })
        .promise();

      if (result.Parameters) {
        for (const param of result.Parameters) {
          if (param.Name?.includes('from-email') && param.Value) {
            this.config.fromEmail = param.Value;
          } else if (param.Name?.includes('reply-to-email') && param.Value) {
            this.config.replyToEmail = param.Value;
          } else if (param.Name?.includes('base-url') && param.Value) {
            this.config.baseUrl = param.Value;
          }
        }
      }

      this.parametersLoaded = true;
      console.log('✅ Email configuration loaded from Parameter Store');
    } catch (error) {
      console.warn(
        '⚠️ Failed to load email config from Parameter Store, using defaults:',
        error
      );
      this.parametersLoaded = true; // Don't retry
    }
  }

  /**
   * Generate a secure token for email verification or password reset
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash a token for secure storage
   */
  private async hashToken(token: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(token, saltRounds);
  }

  /**
   * Verify a token against stored hash
   */
  private async verifyToken(
    token: string,
    hashedToken: string
  ): Promise<boolean> {
    return bcrypt.compare(token, hashedToken);
  }

  /**
   * Send email verification token
   */
  public async sendEmailVerification(
    user: IUser,
    deviceInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Load configuration from Parameter Store if in Lambda
      await this.loadConfigFromParameterStore();
      // Generate verification token
      const token = this.generateToken();
      const hashedToken = await this.hashToken(token);

      // Set expiration (24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Revoke any existing email verification tokens for this user
      await EmailToken.revokeAllForUser(user._id as any, 'email_verification');

      // Create new email token
      const emailToken = new EmailToken({
        token: hashedToken,
        userId: user._id,
        email: user.email,
        type: 'email_verification',
        expiresAt,
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
      });

      await emailToken.save();

      // Create verification URL
      const verificationUrl = `${this.config.baseUrl}/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;

      // Send email
      const emailSent = await this.sendVerificationEmail(user, verificationUrl);

      if (emailSent.success) {
        console.log(`✅ Email verification sent to: ${user.email}`);
        return {
          success: true,
          message: 'Verification email sent successfully',
        };
      } else {
        // Clean up token if email failed to send
        await emailToken.deleteOne();
        return emailSent;
      }
    } catch (error) {
      console.error('Error sending email verification:', error);
      return {
        success: false,
        message: 'Failed to send verification email',
      };
    }
  }

  /**
   * Verify email token
   */
  public async verifyEmailToken(
    token: string,
    email: string
  ): Promise<{
    success: boolean;
    message: string;
    user?: IUser;
  }> {
    try {
      // Find all unused email verification tokens for this email
      const emailTokens = await EmailToken.find({
        email: email.toLowerCase(),
        type: 'email_verification',
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).populate('userId');

      // Check each token for a match
      for (const emailToken of emailTokens) {
        const isMatch = await this.verifyToken(token, emailToken.token);
        if (isMatch) {
          // Mark token as used
          await emailToken.markAsUsed();

          // Update user's email verification status
          const user = await User.findByIdAndUpdate(
            emailToken.userId,
            { isEmailVerified: true },
            { new: true }
          );

          if (user) {
            console.log(`✅ Email verified for user: ${user.email}`);
            return {
              success: true,
              message: 'Email verified successfully',
              user,
            };
          }
        }
      }

      return {
        success: false,
        message: 'Invalid or expired verification token',
      };
    } catch (error) {
      console.error('Error verifying email token:', error);
      return {
        success: false,
        message: 'Failed to verify email',
      };
    }
  }

  /**
   * Send password reset token
   */
  public async sendPasswordReset(
    email: string,
    deviceInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Load configuration from Parameter Store if in Lambda
      await this.loadConfigFromParameterStore();
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if email exists or not for security
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        };
      }

      // Generate reset token
      const token = this.generateToken();
      const hashedToken = await this.hashToken(token);

      // Set expiration (1 hour from now)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Revoke any existing password reset tokens for this user
      await EmailToken.revokeAllForUser(user._id as any, 'password_reset');

      // Create new reset token
      const emailToken = new EmailToken({
        token: hashedToken,
        userId: user._id,
        email: user.email,
        type: 'password_reset',
        expiresAt,
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
      });

      await emailToken.save();

      // Create reset URL
      const resetUrl = `${this.config.baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

      // Send email
      const emailSent = await this.sendPasswordResetEmail(user, resetUrl);

      if (emailSent.success) {
        console.log(`✅ Password reset email sent to: ${user.email}`);
      } else {
        // Clean up token if email failed to send
        await emailToken.deleteOne();
      }

      // Always return success message for security
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      };
    } catch (error) {
      console.error('Error sending password reset:', error);
      return {
        success: false,
        message: 'Failed to send password reset email',
      };
    }
  }

  /**
   * Verify password reset token
   */
  public async verifyPasswordResetToken(
    token: string,
    email: string
  ): Promise<{
    success: boolean;
    message: string;
    userId?: string;
  }> {
    try {
      // Find all unused password reset tokens for this email
      const emailTokens = await EmailToken.find({
        email: email.toLowerCase(),
        type: 'password_reset',
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      // Check each token for a match
      for (const emailToken of emailTokens) {
        const isMatch = await this.verifyToken(token, emailToken.token);
        if (isMatch) {
          return {
            success: true,
            message: 'Password reset token is valid',
            userId: emailToken.userId.toString(),
          };
        }
      }

      return {
        success: false,
        message: 'Invalid or expired reset token',
      };
    } catch (error) {
      console.error('Error verifying password reset token:', error);
      return {
        success: false,
        message: 'Failed to verify reset token',
      };
    }
  }

  /**
   * Complete password reset
   */
  public async resetPassword(
    token: string,
    email: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify token first
      const tokenVerification = await this.verifyPasswordResetToken(
        token,
        email
      );
      if (!tokenVerification.success) {
        return tokenVerification;
      }

      // Find and mark token as used
      const emailTokens = await EmailToken.find({
        email: email.toLowerCase(),
        type: 'password_reset',
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      let tokenFound = false;
      for (const emailToken of emailTokens) {
        const isMatch = await this.verifyToken(token, emailToken.token);
        if (isMatch) {
          await emailToken.markAsUsed();
          tokenFound = true;
          break;
        }
      }

      if (!tokenFound) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      // Update user's password
      const authService = (await import('./auth')).AuthService.getInstance();
      const passwordHash = await authService.hashPassword(newPassword);

      const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { passwordHash },
        { new: true }
      );

      if (user) {
        // Revoke all refresh tokens for security
        await authService.revokeAllRefreshTokens(
          (user._id as any).toString(),
          'password_reset'
        );

        console.log(`✅ Password reset completed for user: ${user.email}`);
        return {
          success: true,
          message: 'Password reset successfully',
        };
      }

      return {
        success: false,
        message: 'Failed to update password',
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        message: 'Failed to reset password',
      };
    }
  }

  /**
   * Send verification email via SES
   */
  private async sendVerificationEmail(
    user: IUser,
    verificationUrl: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const context: EmailTemplateContext = {
        firstName: user.firstName,
        email: user.email,
        verificationUrl,
        appName: 'Ecobeat',
      };

      const htmlBody = this.getEmailVerificationTemplate(context);
      const textBody = this.getEmailVerificationTextTemplate(context);

      const params: AWS.SES.SendEmailRequest = {
        Source: this.config.fromEmail,
        Destination: {
          ToAddresses: [user.email],
        },
        ReplyToAddresses: [this.config.replyToEmail],
        Message: {
          Subject: {
            Data: 'Verify your Ecobeat account',
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
      };

      if (process.env.NODE_ENV === 'development') {
        // In development, just log the email instead of sending
        console.log('📧 [DEV] Email Verification:', {
          to: user.email,
          verificationUrl,
          textBody,
        });
        return { success: true, message: 'Email logged in development mode' };
      }

      await this.ses.sendEmail(params).promise();
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Error sending verification email via SES:', error);
      return { success: false, message: 'Failed to send email' };
    }
  }

  /**
   * Send password reset email via SES
   */
  private async sendPasswordResetEmail(
    user: IUser,
    resetUrl: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const context: EmailTemplateContext = {
        firstName: user.firstName,
        email: user.email,
        resetUrl,
        appName: 'Ecobeat',
      };

      const htmlBody = this.getPasswordResetTemplate(context);
      const textBody = this.getPasswordResetTextTemplate(context);

      const params: AWS.SES.SendEmailRequest = {
        Source: this.config.fromEmail,
        Destination: {
          ToAddresses: [user.email],
        },
        ReplyToAddresses: [this.config.replyToEmail],
        Message: {
          Subject: {
            Data: 'Reset your Ecobeat password',
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
      };

      if (process.env.NODE_ENV === 'development') {
        // In development, just log the email instead of sending
        console.log('📧 [DEV] Password Reset:', {
          to: user.email,
          resetUrl,
          textBody,
        });
        return { success: true, message: 'Email logged in development mode' };
      }

      await this.ses.sendEmail(params).promise();
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Error sending password reset email via SES:', error);
      return { success: false, message: 'Failed to send email' };
    }
  }

  /**
   * HTML template for email verification
   */
  private getEmailVerificationTemplate(context: EmailTemplateContext): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your ${context.appName} account</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Welcome to ${context.appName}! 🌱</h1>
          </div>
          <div class="content">
              <p>Hi ${context.firstName},</p>
              <p>Thanks for signing up for ${context.appName}! To complete your registration and start your sustainability journey, please verify your email address.</p>
              <p style="text-align: center;">
                  <a href="${context.verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">
                  ${context.verificationUrl}
              </p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account with ${context.appName}, you can safely ignore this email.</p>
          </div>
          <div class="footer">
              <p>This email was sent to ${context.email}</p>
              <p>${context.appName} - Making sustainability accessible for everyone</p>
          </div>
      </body>
      </html>
    `;
  }

  /**
   * Text template for email verification
   */
  private getEmailVerificationTextTemplate(
    context: EmailTemplateContext
  ): string {
    return `
Welcome to ${context.appName}! 🌱

Hi ${context.firstName},

Thanks for signing up for ${context.appName}! To complete your registration and start your sustainability journey, please verify your email address.

Verify your email by visiting this link:
${context.verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with ${context.appName}, you can safely ignore this email.

---
This email was sent to ${context.email}
${context.appName} - Making sustainability accessible for everyone
    `;
  }

  /**
   * HTML template for password reset
   */
  private getPasswordResetTemplate(context: EmailTemplateContext): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your ${context.appName} password</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
              .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Reset Your Password 🔐</h1>
          </div>
          <div class="content">
              <p>Hi ${context.firstName},</p>
              <p>We received a request to reset the password for your ${context.appName} account.</p>
              <p style="text-align: center;">
                  <a href="${context.resetUrl}" class="button">Reset Password</a>
              </p>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">
                  ${context.resetUrl}
              </p>
              <div class="warning">
                  <strong>Important:</strong> This link will expire in 1 hour for your security.
              </div>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
              <p>This email was sent to ${context.email}</p>
              <p>${context.appName} - Making sustainability accessible for everyone</p>
          </div>
      </body>
      </html>
    `;
  }

  /**
   * Text template for password reset
   */
  private getPasswordResetTextTemplate(context: EmailTemplateContext): string {
    return `
Reset Your Password 🔐

Hi ${context.firstName},

We received a request to reset the password for your ${context.appName} account.

Reset your password by visiting this link:
${context.resetUrl}

Important: This link will expire in 1 hour for your security.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

---
This email was sent to ${context.email}
${context.appName} - Making sustainability accessible for everyone
    `;
  }
}
