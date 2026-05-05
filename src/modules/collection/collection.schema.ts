import { z } from "zod";

export const createCollectionSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().optional(),
  category: z.string().trim().min(1),
  image: z
    .object({
      url: z.string().trim().min(1),
      public_id: z.string().trim().optional(),
      altText: z.string().trim().optional(),
    })
    .optional(),
  cta: z.string().trim().optional(),
  priority: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
});
