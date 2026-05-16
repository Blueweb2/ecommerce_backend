import mongoose, { Schema, Document } from "mongoose";
import { IPromoCode } from "./promo.types";

export interface IPromoCodeDoc extends IPromoCode, Document {}

const promoCodeSchema = new Schema<IPromoCodeDoc>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    usedCount: {
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

// Index for faster lookup and uniqueness
promoCodeSchema.index({ code: 1 }, { unique: true });

export const PromoCode = mongoose.model<IPromoCodeDoc>("PromoCode", promoCodeSchema);
