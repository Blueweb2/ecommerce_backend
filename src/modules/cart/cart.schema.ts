import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.number().positive("Price must be positive"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});
