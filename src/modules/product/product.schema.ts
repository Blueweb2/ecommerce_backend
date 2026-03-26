import { z } from "zod";

const productVariantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  price: z.number().positive().optional(),
  discountPrice: z.number().positive().optional(),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  sku: z.string().regex(/^[A-Z0-9\-]+$/, "SKU must contain only uppercase letters, numbers, and hyphens").optional(),
  images: z
    .array(
      z.object({
        url: z.string().url("Each image must be a valid URL"),
        altText: z.string().max(250, "Alt text must be at most 250 characters").optional(),
        public_id: z.string().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .optional(),
  isActive: z.boolean().optional().default(true),
});

export const createProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),

  price: z.number().positive("Price must be a positive number"),
  discountPrice: z.number().positive().optional(),

  category: z.string().min(1, "Category is required"),
  sections: z.array(
    z.enum(["featured", "best-seller", "new-arrival", "top-rated"])
  ).optional(),
  brand: z.string().optional(),
  sku: z.string().regex(/^[A-Z0-9\-]+$/, "SKU must contain only uppercase letters, numbers, and hyphens").optional(),

  stock: z.number().int().min(0, "Stock cannot be negative"),

  images: z
    .array(
      z.object({
        url: z.string().url("Each image must be a valid URL"),
        altText: z.string().max(250, "Alt text must be at most 250 characters").optional(),
        public_id: z.string().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .optional(),

  variants: z.array(productVariantSchema).optional(),

  isPublished: z.boolean().optional().default(true),
})
.superRefine((data, ctx) => {
  if (data.discountPrice !== undefined && data.discountPrice >= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Discount price must be less than price",
      path: ["discountPrice"],
    });
  }
});

export const updateProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200).optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000).optional(),

  price: z.number().positive("Price must be a positive number").optional(),
  discountPrice: z.number().positive().optional(),

  category: z.string().min(1, "Category is required").optional(),
  sections: z.array(
    z.enum(["featured", "best-seller", "new-arrival", "top-rated"])
  ).optional(),
  brand: z.string().optional(),
  sku: z.string().regex(/^[A-Z0-9\-]+$/, "SKU must contain only uppercase letters, numbers, and hyphens").optional(),

  stock: z.number().int().min(0, "Stock cannot be negative").optional(),

  images: z
    .array(
      z.object({
        url: z.string().url("Each image must be a valid URL"),
        public_id: z.string().optional(),
        altText: z.string().max(250, "Alt text must be at most 250 characters").optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .optional(),

  variants: z.array(productVariantSchema).optional(),

  isPublished: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.discountPrice !== undefined && data.price !== undefined && data.discountPrice >= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Discount price must be less than price",
      path: ["discountPrice"],
    });
  }
});
