import { z } from "zod";

const designerImageSchema = z.object({
  url: z.string().url("Image url must be a valid URL"),
  public_id: z.string().min(1, "Image public_id is required"),
  alt: z.string().max(250).optional(),
  altText: z.string().max(250).optional(),
});

// Admin creates account with only: name, email, password
export const adminCreateDesignerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Designer updates their own profile (all profile content fields)
export const updateDesignerProfileSchema = z
  .object({
    brandName: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),

    businessName: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    gstNumber: z.string().trim().optional(),
    website: z.string().trim().optional(),

    categories: z.array(z.string()).optional(),

    address: z
      .object({
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        district: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
      })
      .optional(),

    socialLinks: z
      .object({
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        youtube: z.string().optional(),
        pinterest: z.string().optional(),
        twitter: z.string().optional(),
      })
      .optional(),

    avatar: designerImageSchema.optional(),
    brandImage: designerImageSchema.optional(),
    bannerImage: designerImageSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

// Admin storefront controls only
export const adminStorefrontSchema = z
  .object({
    isFeatured: z.boolean().optional(),
    isFavorite: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one storefront field is required",
  });

// Legacy: used by admin full-update (kept for backward compat)
export const createDesignerSchema = adminCreateDesignerSchema;

export const updateDesignerSchema = updateDesignerProfileSchema;
