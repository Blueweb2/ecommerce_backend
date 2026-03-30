import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().optional(),
  parent: z
    .union([
      z.string().regex(/^[a-f\d]{24}$/i, "Parent must be a valid category id"),
      z.null(),
      z.literal(""),
    ])
    .transform((val) => (val === "" ? null : val))
    .optional(),
  image: z
    .object({
      url: z.string().url("Image must be a valid URL"),
      public_id: z.string().min(1, "public_id is required"),
      altText: z
        .string()
        .max(250, "Alt text must be at most 250 characters")
        .optional(),
    })
    .optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();
