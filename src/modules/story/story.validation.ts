// src/modules/story/story.validation.ts

import { z } from "zod";

export const createStorySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().optional(),
  image: z.object({
    url: z.string().url("Invalid image URL"),
    public_id: z.string().min(1, "Public ID is required"),
    alt: z.string().optional(),
  }),
  isActive: z.boolean().optional(),
});
