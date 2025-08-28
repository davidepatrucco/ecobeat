import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  profile: {
    sustainabilityGoals: string[];
    preferences: {
      notifications: boolean;
      theme: 'light' | 'dark' | 'auto';
      language: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 60, // bcrypt hash length
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    profile: {
      sustainabilityGoals: [
        {
          type: String,
          enum: [
            'reduce_waste',
            'save_energy',
            'sustainable_transport',
            'eco_diet',
            'water_conservation',
          ],
        },
      ],
      preferences: {
        notifications: {
          type: Boolean,
          default: true,
        },
        theme: {
          type: String,
          enum: ['light', 'dark', 'auto'],
          default: 'auto',
        },
        language: {
          type: String,
          default: 'en',
        },
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: {
      transform: function (_doc, ret) {
        // Remove sensitive data when converting to JSON
        const { passwordHash, ...userWithoutPassword } = ret;
        return userWithoutPassword;
      },
    },
  }
);

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: -1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export const User = mongoose.model<IUser>('User', UserSchema);
