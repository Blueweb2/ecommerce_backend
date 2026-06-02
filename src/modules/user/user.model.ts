import mongoose, { Schema, Document } from "mongoose";


export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin" | "superadmin";
  isActive: boolean;
  deletedAt?: Date | null;

  emailVerified: boolean;
  phoneVerified: boolean;

  // 🔥 ADD THESE
  verificationCode?: string;
  verificationExpires?: Date;
  phoneVerificationCode?: string | null;
  phoneVerificationExpires?: Date | null;

  refreshToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    verificationCode: {
      type: String,
      default: null,
    },
    verificationExpires: {
      type: Date,
      default: null,
    },
    phoneVerificationCode: {
      type: String,
      default: null,
    },
    phoneVerificationExpires: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
      deletedAt: {
  type: Date,
  default: null,
},
  },
  { timestamps: true },

);




export const User = mongoose.model<IUser>("User", userSchema);
