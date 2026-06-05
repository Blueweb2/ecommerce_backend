import { Document, Types } from "mongoose";

export interface IDesignerImage {
  url: string;
  public_id: string;
  alt?: string;
  altText?: string;
}

export interface IDesignerAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface IDesignerSocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  pinterest?: string;
  twitter?: string;
}

export interface IDesigner extends Document {
  name: string;
  slug: string;
  description: string;
  brandName: string;

  businessName?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  website?: string;
  categories?: Types.ObjectId[];
  
  address?: IDesignerAddress;
  socialLinks?: IDesignerSocialLinks;
  
  isFeatured?: boolean;
  role?: "designer";
  password?: string;
  lastLogin?: Date;

  avatar?: IDesignerImage;
  brandImage?: IDesignerImage;
  bannerImage?: IDesignerImage;
  isFavorite: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
