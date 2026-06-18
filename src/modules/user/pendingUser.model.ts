import mongoose, { Schema, Document } from "mongoose";

export interface IPendingUser extends Document {
  name: string;
  email: string;
  password: string; // Already hashed
  phone: string;

  emailOtp: string;
  emailOtpExpires: Date;
  emailVerified: boolean;

  phoneOtp: string;
  phoneOtpExpires: Date;
  phoneVerified: boolean;

  createdAt: Date;
}

const pendingUserSchema = new Schema<IPendingUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    emailOtp: {
      type: String,
      required: true,
    },
    emailOtpExpires: {
      type: Date,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneOtp: {
      type: String,
      required: true,
    },
    phoneOtpExpires: {
      type: Date,
      required: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900, // Native TTL: Document auto-deletes 15 minutes after creation
    },
  },
  { timestamps: true }
);

// ✅ Create compound index or unique indexes if necessary, but keep it simple as TTL manages expiration
pendingUserSchema.index({ email: 1 }, { unique: true });

export const PendingUser = mongoose.model<IPendingUser>("PendingUser", pendingUserSchema);
