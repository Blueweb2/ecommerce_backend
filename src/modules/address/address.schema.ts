import { z } from "zod";

const addressBaseSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  street: z.string().min(3, "Street must be at least 3 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  isDefault: z.boolean().optional(),
});

export const createAddressSchema = addressBaseSchema;

export const updateAddressSchema = addressBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one address field is required",
  });
