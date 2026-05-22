import { z } from "zod";
import { normalizePhoneNumber } from "../../utils/phone";

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform((value) => normalizePhoneNumber(value))
  .pipe(
    z
      .string()
      .regex(
        /^[6-9]\d{9}$/,
        "Enter a valid 10-digit Indian mobile number (starts with 6–9)"
      )
  );

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  phone: phoneSchema,
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
    shippingCharge: z.number().min(0),
    promoCode: z.string().optional(),
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