import { Router } from "express";
import {
  getCartHandler,
  addToCartHandler,
  updateCartItemHandler,
  removeFromCartHandler,
  clearCartHandler,
} from "./cart.controller";

import { protect } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { addToCartSchema, updateCartItemSchema } from "./cart.schema";

const router = Router();

router.use(protect); // All cart routes require authentication

// Get cart
router.get("/", getCartHandler);

// Add to cart
router.post("/", validate(addToCartSchema), addToCartHandler);

// Update cart item quantity (must come BEFORE clear route)
router.put("/:productId", validate(updateCartItemSchema), updateCartItemHandler);

// Remove specific item from cart
router.delete("/:productId", removeFromCartHandler);

// Clear entire cart (must come AFTER /:productId routes)
router.delete("/", clearCartHandler);

export default router;
