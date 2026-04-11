// modules/wishlist/wishlist.routes.ts

import { Router } from "express";
import {
  getWishlist,
  toggleWishlist,
  mergeWishlist,
} from "./wishlist.controller";

import { protect } from "../../middlewares/auth";

const router = Router();

router.get("/", protect, getWishlist);
router.post("/", protect, toggleWishlist);
router.post("/merge", protect, mergeWishlist);

export default router;