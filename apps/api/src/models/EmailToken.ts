import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IEmailToken extends Document {
  token: string; // The verification token (hashed)
  userId: mongoose.Types.ObjectId;
  email: string; // Email to verify (in case user changes email)
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
  createdAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  ipAddress?: string;
  userAgent?: string;

  // Virtual properties
  isExpired: boolean;
  isValid: boolean;

  // Instance methods
  markAsUsed(): Promise<IEmailToken>;
}

// Interface for static methods
export interface IEmailTokenModel extends Model<IEmailToken> {
  cleanupExpired(): Promise<any>;
  findValidToken(token: string, type: string): Promise<IEmailToken | null>;
  revokeAllForUser(userId: mongoose.Types.ObjectId, type: string): Promise<any>;
}

const EmailTokenSchema = new Schema<IEmailToken>(
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
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['email_verification', 'password_reset'],
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
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
EmailTokenSchema.index({ userId: 1, type: 1, isUsed: 1 });
EmailTokenSchema.index({ token: 1, type: 1, isUsed: 1 });
EmailTokenSchema.index({ email: 1, type: 1, isUsed: 1 });

// Virtual to check if token is expired
EmailTokenSchema.virtual('isExpired').get(function (this: IEmailToken) {
  return new Date() > this.expiresAt;
});

// Virtual to check if token is valid (not used and not expired)
EmailTokenSchema.virtual('isValid').get(function (this: IEmailToken) {
  return !this.isUsed && !this.isExpired;
});

// Instance method to mark token as used
EmailTokenSchema.methods.markAsUsed = function () {
  this.isUsed = true;
  this.usedAt = new Date();
  return this.save();
};

// Static method to cleanup expired and used tokens
EmailTokenSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      {
        isUsed: true,
        usedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }, // Keep used tokens for 7 days
    ],
  });
};

// Static method to find a valid token
EmailTokenSchema.statics.findValidToken = function (
  token: string,
  type: string
) {
  return this.findOne({
    token,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).populate('userId');
};

// Static method to revoke all tokens for a user of a specific type
EmailTokenSchema.statics.revokeAllForUser = function (
  userId: mongoose.Types.ObjectId,
  type: string
) {
  return this.updateMany(
    { userId, type, isUsed: false },
    {
      isUsed: true,
      usedAt: new Date(),
    }
  );
};

export const EmailToken = mongoose.model<IEmailToken, IEmailTokenModel>(
  'EmailToken',
  EmailTokenSchema
);
