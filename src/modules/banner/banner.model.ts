import mongoose, { Document, Model } from "mongoose";
import { bannerSchema } from "./banner.schema";

// ✅ Image type
export interface IBannerImage {
  url: string;
  public_id: string;
}

// ✅ TypeScript interface for Banner document
export interface MBannerDocument extends Document {
  title?: string;
  image: {
    url: string;
    public_id: string;
  };
  link?: string;
  position: "hero" | "center" | "rightTop" | "rightBottom";
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Model type
export interface IBannerModel extends Model<MBannerDocument> {}

// ✅ Model
export const Banner = mongoose.model<MBannerDocument, IBannerModel>(
  "Banner",
  bannerSchema
);