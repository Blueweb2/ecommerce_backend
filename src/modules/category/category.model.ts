import mongoose, { Document, Schema } from "mongoose";

export interface ICategoryImage {
  url: string;
  public_id: string;
  altText?: string;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: ICategoryImage;
  parent?: mongoose.Types.ObjectId | null;
  level: number;
  isCustomizable: boolean;
  customFields?: {
    name: string;
    type: "text" | "number" | "select";
    required?: boolean;
    options?: string[];
    unit?: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
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
    description: {
      type: String,
      trim: true,
    },
    isCustomizable: {
      type: Boolean,
      default: false,
    },

    customFields: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ["text", "number", "select"],
          required: true,
        },
        required: { type: Boolean, default: false },
        options: [String],
        unit: String,
      },
    ],
    image: {
      url: {
        type: String,
        trim: true,
      },
      public_id: {
        type: String,
        trim: true,
      },
      altText: {
        type: String,
        trim: true,
        default: "",
      },
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    level: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate category names under the same parent.
categorySchema.index({ name: 1, parent: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>("Category", categorySchema);
