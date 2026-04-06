import { z } from "zod";
const productVariantSchema = z
  .object({
    attributes: z
      .record(z.string().min(1), z.string().min(1))
      .refine((obj) => Object.keys(obj).length > 0, {
        message: "Variant must have at least one attribute",
      }),

    discountPrice: z.number().positive().optional(),
    price: z.coerce.number().positive().optional(),
    stock: z.coerce.number().int().min(0),




    sku: z.string().regex(/^[A-Z0-9\-]+$/).optional(),

    images: z
      .array(
        z.object({
          url: z.string().url(),
          altText: z.string().optional(),
          public_id: z.string().optional(),
          isPrimary: z.boolean().optional(),
        })
      )
      .optional(),

    isActive: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (
      data.discountPrice !== undefined &&
      data.price !== undefined &&
      data.discountPrice >= data.price
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Variant discount must be less than price",
        path: ["discountPrice"],
      });
    }
  });

export const createProductSchema = z
  .object({
    name: z.string().min(3).max(200),
    description: z.string().min(10).max(5000),

    // price: z.number().positive(),
    discountPrice: z.number().positive().optional(),

    price: z.coerce.number().positive(),

    category: z.string().min(1),

    sections: z
      .array(z.enum(["featured", "best-seller", "new-arrival", "top-rated"]))
      .optional(),

    brand: z.string().optional(),

    sku: z.string().regex(/^[A-Z0-9\-]+$/).optional(),

    // stock: z.number().int().min(0),
    stock: z.coerce.number().int().min(0),
    images: z
      .array(
        z.object({
          url: z.string().url(),
          altText: z.string().optional(),
          public_id: z.string().optional(),
          isPrimary: z.boolean().optional(),
        })
      )
      .optional(),

    attributes: z
      .array(
        z.object({
          name: z.string().min(1),
          values: z.array(z.string().min(1)).min(1),
        })
      )
      .optional(),

    variants: z.array(productVariantSchema).optional(),

    // isPublished: z.boolean().optional().default(true),
    isPublished: z.coerce.boolean().optional().default(true),

  })
  .superRefine((data, ctx) => {
    // ✅ Product discount validation
    if (
      data.discountPrice !== undefined &&
      data.discountPrice >= data.price
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Discount price must be less than price",
        path: ["discountPrice"],
      });
    }

    // ✅ Duplicate variant check
    if (data.variants) {
      const seen = new Set();

      for (const variant of data.variants) {
        const key = JSON.stringify(variant.attributes);

        if (seen.has(key)) {
          ctx.addIssue({
            code: "custom",
            message: "Duplicate variant combination found",
            path: ["variants"],
          });
        }

        seen.add(key);
      }
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
  attributes: z
    .array(
      z.object({
        name: z.string().min(1),
        values: z.array(z.string().min(1)).min(1),
      })
    )
    .optional(),

  variants: z.array(productVariantSchema).optional(),

  isPublished: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.discountPrice !== undefined && data.price !== undefined && data.discountPrice >= data.price) {
    ctx.addIssue({
      code: "custom",
      message: "Discount price must be less than price",
      path: ["discountPrice"],
    });
  }
});
