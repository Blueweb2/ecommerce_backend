import { Document } from "mongoose";

export interface IDesignerImage {
  url: string;
  public_id: string;
  alt?: string;
  altText?: string;
}

export interface IDesigner extends Document {
  name: string;
  slug: string;
  description: string;
  brandName: string;
  avatar?: IDesignerImage;
  brandImage?: IDesignerImage;
  bannerImage?: IDesignerImage;
  isFavorite: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
