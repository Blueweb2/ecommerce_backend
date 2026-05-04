import { z } from "zod";

export const shippingAddressSchema = z.object({
  street: z.string().trim().min(5, "Street is required"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  postalCode: z
    .string()
    .regex(/^\d{6}$/, "Postal code must be 6 digits"),
  country: z.string().trim().min(2, "Country is required"),
});

export const createOrderSchema = z
  .object({
    shippingAddress: shippingAddressSchema,
    paymentMethod: z.enum(["cod", "razorpay"]),
    notes: z.string().max(500).optional(),
  })
  .strict();

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});