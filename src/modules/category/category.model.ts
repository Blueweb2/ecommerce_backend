import mongoose, { Schema, Document } from "mongoose";

export interface ICategoryImage {
  url: string;
  altText?: string;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: ICategoryImage;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      url: {
        type: String,
        trim: true,
      },
      altText: {
        type: String,
        trim: true,
        default: "",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>("Category", categorySchema);
