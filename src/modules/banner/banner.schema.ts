import { Schema } from "mongoose";

export const bannerSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
    },

    // ✅ FIXED IMAGE STRUCTURE
    image: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },

    link: {
      type: String,
      trim: true,
    },

    position: {
      type: String,
      enum: ["hero", "center", "rightTop", "rightBottom"],
      required: true,
    },

    order: {
      type: Number,
      default: 0,
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