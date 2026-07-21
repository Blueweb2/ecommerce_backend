// src/modules/story/story.validation.ts

import { z } from "zod";

export const storySectionValidation = z.object({
  layout: z.enum(["image-left", "image-right", "full-image", "text"]),
  heading: z.string().optional(),
  content: z.string().optional(),
  image: z.object({
    url: z.string().url(),
    public_id: z.string().min(1),
    alt: z.string().optional(),
  }).optional(),
  caption: z.string().optional(),
  products: z.array(z.string()).optional().default([]),
  order: z.number().int().min(0),
});

export const createStorySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  publishDate: z.string().optional(),
  featured: z.boolean().optional().default(false),
  heroImage: z.object({
    url: z.string().url("Invalid image URL"),
    public_id: z.string().min(1, "Public ID is required"),
    alt: z.string().optional(),
  }),
  sections: z.array(storySectionValidation).optional().default([]),
  isActive: z.boolean().optional(),
});

const optionalTrimmedString = (field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field} cannot be empty`)
    .optional();

const booleanFromFormData = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return value;
}, z.boolean().optional());

export const updateStorySchema = z
  .object({
    title: optionalTrimmedString("Title"),
    slug: optionalTrimmedString("Slug"),
    excerpt: z.string().optional(),
    author: z.string().optional(),
    publishDate: z.string().optional(),
    featured: booleanFromFormData,
    imageAlt: z.string().trim().optional(),
    isActive: booleanFromFormData,
    sections: z.array(storySectionValidation).optional(),
  });

export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
