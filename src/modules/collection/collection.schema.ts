import { z } from "zod";

const collectionFiltersSchema = z
  .object({
    category: z.string().trim().min(1).optional(),
    type: z.string().trim().min(1).optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    priceMin: z.coerce.number().min(0).optional(),
    priceMax: z.coerce.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      typeof data.priceMin === "number" &&
      typeof data.priceMax === "number" &&
      data.priceMin > data.priceMax
    ) {
      ctx.addIssue({
        code: "custom",
        message: "priceMin cannot be greater than priceMax",
        path: ["priceMin"],
      });
    }
  });

export const createCollectionSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().min(1),
  image: z.object({
    url: z.string().trim().min(1),
  }),
  filters: collectionFiltersSchema.default({}),
  isActive: z.coerce.boolean().default(true),
});
