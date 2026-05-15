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
