
// modules/wishlist/wishlist.types.ts

import { Types } from "mongoose";

export interface IWishlistItem {
  product: Types.ObjectId;
}

export interface IWishlist {
  user: Types.ObjectId;
  items: IWishlistItem[];
}