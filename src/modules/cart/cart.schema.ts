import { z } from "zod";

/**
 * 🔹 Selected Option Schema (Shared)
 */
export const selectedOptionSchema = z.object({
  fieldName: z.string().min(1, "Field name is required"),
  value: z.string().min(1, "Value is required"),
});

/**
 * 🔹 Add To Cart Schema
 */
export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),

  variantId: z.string().optional(),

  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1"),

  price: z
    .number()
    .positive("Price must be positive"),

  selectedOptions: z
    .array(selectedOptionSchema)
    .optional()
    .default([]),
});

/**
 * 🔹 Update Cart Item Schema
 */
export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .optional(),

  selectedOptions: z
    .array(selectedOptionSchema)
    .optional(),
});