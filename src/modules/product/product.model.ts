import mongoose, { Schema, Document } from "mongoose";
import { Types } from "mongoose";

export interface IProductImage {
  url: string;
  altText?: string;
  public_id?: string;
  isPrimary?: boolean;
}

export interface IProductVariant {
  attributes: Record<string, string>;
  price?: number;
  discountPrice?: number;
  stock: number;
  sku?: string;
  images?: IProductImage[];
  isActive: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: mongoose.Types.ObjectId;
  sections: string[];
  brand?: string;
  stock: number;
  images: IProductImage[];
  attributes: {
    name: string;
    values: string[];
  }[];
  variants: IProductVariant[];
  isPublished: boolean;
  ratingsAverage: number;
  ratingsCount: number;
  createdAt: Date;
  updatedAt: Date;
}
const variantSchema = new Schema<IProductVariant>(
  {
    attributes: {
      type: Map,
      of: String,
      required: true,
    },

    price: {
      type: Number,
      min: 0,
    },

    discountPrice: {
      type: Number,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    sku: {
      type: String,
      trim: true,
      uppercase: true,
    },

    images: [
      {
        url: String,
        altText: String,
        public_id: String,
        isPrimary: Boolean,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
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
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    sections: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    brand: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },
        altText: {
          type: String,
          trim: true,
          default: "",
        },
        public_id: {
          type: String,
          trim: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],


    attributes: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        values: [
          {
            type: String,
            trim: true,
          },
        ],
      },
    ],
    variants: {
      type: [variantSchema],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
productSchema.index({ name: "text", description: "text", brand: "text" });
productSchema.index({ "variants.sku": 1 }, { unique: true });

// Index for queries
productSchema.index({ category: 1, sections: 1, isPublished: 1 });
export const Product = mongoose.model<IProduct>("Product", productSchema);
