import { z } from "zod";


const customDataSchema = z.object({
  fieldName: z.string().min(1, "Field name is required"),
  value: z.string().min(1, "Value is required"),
});

export const addToCartSchema = z.object({
  productId: z.string(),

  quantity: z.number().int().min(1, "Quantity must be at least 1"),

  price: z.number().positive("Price must be positive"),

  // ✅ NEW
  selectedSize: z.string().optional(),

  // ✅ NEW
  customData: z.array(customDataSchema).optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
   selectedSize: z.string().optional(),

  customData: z.array(customDataSchema).optional(),
});
