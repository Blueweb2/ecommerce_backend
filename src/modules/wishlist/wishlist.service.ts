// modules/wishlist/wishlist.service.ts

import { Wishlist } from "./wishlist.model";
import { Types } from "mongoose";

// ✅ GET
export const getWishlistService = async (userId: string) => {
  let wishlist = await Wishlist.findOne({ user: userId })
    .populate("items.product");

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      items: [],
    });
  }

  return wishlist;
};

// ✅ TOGGLE
export const toggleWishlistService = async (
  userId: string,
  productId: string
) => {
  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      items: [],
    });
  }

  const exists = wishlist.items.find(
    (item) => item.product.toString() === productId
  );

  if (exists) {
    wishlist.items = wishlist.items.filter(
      (item) => item.product.toString() !== productId
    );
  } else {
    wishlist.items.push({
      product: new Types.ObjectId(productId),
    });
  }

  await wishlist.save();

  return wishlist;
};

// ✅ MERGE
export const mergeWishlistService = async (
  userId: string,
  items: { productId: string }[]
) => {
  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      items: [],
    });
  }

  const existingIds = wishlist.items.map((i) =>
    i.product.toString()
  );

  items.forEach((item) => {
    if (!existingIds.includes(item.productId)) {
      wishlist.items.push({
        product: new Types.ObjectId(item.productId),
      });
    }
  });

  await wishlist.save();

  return wishlist;
};