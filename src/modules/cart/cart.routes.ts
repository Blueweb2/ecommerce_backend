import { Router } from "express";
import {
  getCartHandler,
  addToCartHandler,
  updateCartItemHandler,
  removeFromCartHandler,
  clearCartHandler,
  mergeCartHandler,
} from "./cart.controller";

import { protect } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { addToCartSchema, updateCartItemSchema } from "./cart.schema";

const router = Router();

// 🔒 All routes protected
router.use(protect);

/**
 * 🛒 GET CART
 */
router.get("/", getCartHandler);

/**
 * ➕ ADD ITEM
 */
router.post("/", validate(addToCartSchema), addToCartHandler);

/**
 * 🔄 MERGE CART (on login)
 */
router.post("/merge", mergeCartHandler);

/**
 * ✏️ UPDATE ITEM (by itemId)
 */
router.patch(
  "/item/:itemId",
  validate(updateCartItemSchema),
  updateCartItemHandler
);

/**
 * ❌ REMOVE ITEM (by itemId)
 */
router.delete("/item/:itemId", removeFromCartHandler);

/**
 * 🧹 CLEAR CART
 */
router.delete("/", clearCartHandler);

export default router;