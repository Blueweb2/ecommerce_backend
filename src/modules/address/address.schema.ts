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

const addressBaseSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().optional(),
  phone: phoneSchema,
  street: z.string().min(3, "Street must be at least 3 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Postal code must be 6 digits"),
  country: z.string().min(2, "Country is required"),
  isDefault: z.boolean().optional(),
});

export const createAddressSchema = addressBaseSchema;

export const updateAddressSchema = addressBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one address field is required",
  });
