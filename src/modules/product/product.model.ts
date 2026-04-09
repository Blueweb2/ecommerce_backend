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

  customizable?: {
    isCustomizable: boolean;
    fields: {
      name: string;
      type: "text" | "number" | "select";
      required?: boolean;
      options?: string[];
      unit?: string;
    }[];
  };
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  description: string;
  deliveryDetails: string;
  keyFeatures: string[];
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

customizable: {
  isCustomizable: boolean;
  fields: {
    name: string;
    type: "text" | "number" | "select";
    required?: boolean;
    options?: string[];
    unit?: string;
  }[];
};
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
      required: false,
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
      unique: true,
      lowercase: true,
    },
    sku: {
      type: String,
      required: false,
      unique: true,
      uppercase: true,
      index: true,
      sparse: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryDetails: {
      type: String,
      trim: true,
      default: "",
    },

    customizable: {
  isCustomizable: {
    type: Boolean,
    default: false,
  },

  fields: [
    {
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["text", "number", "select"],
        required: true,
      },
      required: {
        type: Boolean,
        default: false,
      },
      options: [String],
      unit: String,
    },
  ],
},

    keyFeatures: [
      {
        type: String,
        trim: true,
      },
    ],
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
          required: false,
          lowercase: true,
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
productSchema.index({ "variants.sku": 1 }, { sparse: true });

// Index for queries
productSchema.index({ category: 1, sections: 1, isPublished: 1 });
export const Product = mongoose.model<IProduct>("Product", productSchema);
