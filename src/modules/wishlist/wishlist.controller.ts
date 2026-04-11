// modules/wishlist/wishlist.controller.ts

import { Request, Response } from "express";
import {
  getWishlistService,
  toggleWishlistService,
  mergeWishlistService,
} from "./wishlist.service";

// GET
export const getWishlist = async (req: any, res: Response) => {
  const data = await getWishlistService(req.user.id);
  res.json({ success: true, data });
};

// TOGGLE
export const toggleWishlist = async (req: any, res: Response) => {
  const { productId } = req.body;

  const data = await toggleWishlistService(
    req.user.id,
    productId
  );

  res.json({ success: true, data });
};

// MERGE
export const mergeWishlist = async (req: any, res: Response) => {
  const { items } = req.body;

  const data = await mergeWishlistService(
    req.user.id,
    items
  );

  res.json({ success: true, data });
};