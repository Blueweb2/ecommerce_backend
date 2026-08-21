import { z } from "zod";

export const serviceabilitySchema = z.object({
  deliveryPincode: z
    .string({ error: "Delivery pincode is required" })
    .trim()
    .regex(/^\d{6}$/, "Pincode must be a 6-digit Indian postal code"),
  weight: z.number().min(0.01).optional(),
  cod: z.boolean().optional(),
});

export const assignAwbSchema = z.object({
  courierId: z.number().optional(),
});
