import mongoose, { Schema, Document } from "mongoose";
import { Query } from "mongoose";

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

  isOnSale?: boolean; // ✅ ADD THIS

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

  isOnSale: boolean; // ✅ ADD THIS

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
  gstPercentage: number;
  specifications: {
    name: string;
    value: string;
  }[];
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
    isOnSale: {
      type: Boolean,
      default: false,
      index: true,
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
    gstPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },
    specifications: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);



// 🔥 AUTO SET isOnSale ON SAVE (Creation)
productSchema.pre("save", function () {
  if (this.discountPrice && this.price && this.discountPrice < this.price) {
    this.isOnSale = true;
  } else if (!this.isOnSale) {
    this.isOnSale = false;
  }
});



productSchema.pre("findOneAndUpdate", async function () {
  const query = this;

  const update: any = query.getUpdate() || {};

  // Only run logic if pricing or sale toggle is affected
  if (
    typeof update.price === "undefined" &&
    typeof update.discountPrice === "undefined" &&
    typeof update.isOnSale === "undefined"
  ) {
    return;
  }

  const doc = await query.model.findOne(query.getQuery());
  if (!doc) return;

  const price = update.price ?? doc.price;
  const discountPrice = update.discountPrice ?? doc.discountPrice;

  // Auto-manage isOnSale if not explicitly provided in update
  if (typeof update.isOnSale === "undefined") {
    if (discountPrice && price && discountPrice < price) {
      update.isOnSale = true;
    } else {
      update.isOnSale = false;
    }
  }

  query.setUpdate(update);
});




// Text index for search
productSchema.index({ name: "text", description: "text", brand: "text" });
productSchema.index({ "variants.sku": 1 }, { sparse: true });

// Index for queries
productSchema.index({ category: 1, sections: 1, isPublished: 1 });
productSchema.index({ isPublished: 1, sections: 1, createdAt: -1 });
export const Product = mongoose.model<IProduct>("Product", productSchema);
