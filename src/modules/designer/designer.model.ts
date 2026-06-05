import mongoose, { Schema } from "mongoose";
import { IDesigner } from "./designer.types";

const designerImageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    public_id: {
      type: String,
      required: true,
      trim: true,
    },
    alt: {
      type: String,
      trim: true,
      default: "",
    },
    altText: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const designerSchema = new Schema<IDesigner>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    brandName: {
      type: String,
      required: true,
      trim: true,
    },

    businessName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    gstNumber: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    address: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      district: String,
      state: String,
      country: String,
      pincode: String,
    },

    socialLinks: {
      instagram: String,
      facebook: String,
      youtube: String,
      pinterest: String,
      twitter: String,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      default: "designer",
    },

    password: {
      type: String,
      select: false,
    },

    lastLogin: {
      type: Date,
    },

    avatar: {
      type: designerImageSchema,
    },

    brandImage: {
      type: designerImageSchema,
    },

    bannerImage: {
      type: designerImageSchema,
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

designerSchema.index({ slug: 1 }, { unique: true });
designerSchema.index({ isActive: 1, isFavorite: 1, createdAt: -1 });
designerSchema.index({ name: "text", brandName: "text", description: "text" });

export const Designer = mongoose.model<IDesigner>(
  "Designer",
  designerSchema
);
