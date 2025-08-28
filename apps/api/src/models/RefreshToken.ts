import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IRefreshToken extends Document {
  token: string; // The actual refresh token (hashed)
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
    deviceId?: string;
  };
  lastUsedAt?: Date;

  // Virtual properties
  isExpired: boolean;
  isValid: boolean;

  // Instance methods
  revoke(reason?: string): Promise<IRefreshToken>;
}

// Interface for static methods
export interface IRefreshTokenModel extends Model<IRefreshToken> {
  cleanupExpired(): Promise<any>;
  revokeAllForUser(
    userId: mongoose.Types.ObjectId,
    reason?: string
  ): Promise<any>;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index for automatic cleanup
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
      enum: ['logout', 'logout_all', 'security', 'expired', 'replaced'],
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      deviceId: String,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ token: 1, isRevoked: 1 });

// Virtual to check if token is expired
RefreshTokenSchema.virtual('isExpired').get(function (this: IRefreshToken) {
  return new Date() > this.expiresAt;
});

// Virtual to check if token is valid (not revoked and not expired)
RefreshTokenSchema.virtual('isValid').get(function (this: IRefreshToken) {
  return !this.isRevoked && !this.isExpired;
});

// Instance method to revoke token
RefreshTokenSchema.methods.revoke = function (reason = 'logout') {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

// Static method to cleanup expired tokens
RefreshTokenSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      {
        isRevoked: true,
        revokedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }, // Keep revoked tokens for 30 days
    ],
  });
};

// Static method to revoke all tokens for a user
RefreshTokenSchema.statics.revokeAllForUser = function (
  userId: mongoose.Types.ObjectId,
  reason = 'logout_all'
) {
  return this.updateMany(
    { userId, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    }
  );
};

export const RefreshToken = mongoose.model<IRefreshToken, IRefreshTokenModel>(
  'RefreshToken',
  RefreshTokenSchema
);
