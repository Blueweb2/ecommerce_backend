import mongoose, { Document, Schema } from "mongoose";

export interface ICollection extends Document {
  title: string;
  description?: string;

  // 🔥 IMPORTANT: direct category relation
  category: mongoose.Types.ObjectId;

  // Optional thumbnail (future use)
  image?: {
    url: string;
    public_id?: string;
    altText?: string;
  };

  // CTA text (Shop now / Explore)
  cta?: string;

  // control ordering in UI
  priority: number;

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

    description: {
      type: String,
      trim: true,
    },

    // ✅ direct reference (VERY IMPORTANT)
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },



    image: {
      url: String,
      public_id: String,
      altText: String,
    },

    cta: {
      type: String,
      default: "Shop now",
    },

    // 🔥 control order
    priority: {
      type: Number,
      default: 0,
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

// 🔥 useful indexes
collectionSchema.index({ category: 1, priority: -1 });
collectionSchema.index({ isActive: 1, createdAt: -1 });

export const Collection = mongoose.model<ICollection>(
  "Collection",
  collectionSchema
);