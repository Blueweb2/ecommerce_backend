import mongoose, { Document, Schema } from "mongoose";

export interface ICollectionFilters {
  category?: string;
  type?: string;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
}

export interface ICollectionImage {
  url: string;
}

export interface ICollection extends Document {
  title: string;
  slug: string;
  description: string;
  image: ICollectionImage;
  filters: ICollectionFilters;
  isActive: boolean;
  createdAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      url: {
        type: String,
        required: true,
        trim: true,
      },
    },
    filters: {
      category: {
        type: String,
        trim: true,
      },
      type: {
        type: String,
        trim: true,
      },
      tags: [
        {
          type: String,
          trim: true,
        },
      ],
      priceMin: {
        type: Number,
        min: 0,
      },
      priceMax: {
        type: Number,
        min: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

collectionSchema.index({ slug: 1 }, { unique: true });
collectionSchema.index({ isActive: 1, createdAt: -1 });

export const Collection = mongoose.model<ICollection>(
  "Collection",
  collectionSchema
);
