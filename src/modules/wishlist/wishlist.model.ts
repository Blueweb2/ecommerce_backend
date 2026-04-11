// modules/wishlist/wishlist.model.ts

import mongoose, { Schema } from "mongoose";
import { IWishlist } from "./wishlist.types";

const wishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
      },
    ],
  },
  { timestamps: true }
);

export const Wishlist = mongoose.model<IWishlist>(
  "Wishlist",
  wishlistSchema
);