import { z } from "zod";

const designerImageSchema = z.object({
  url: z.string().url("Image url must be a valid URL"),
  public_id: z.string().min(1, "Image public_id is required"),
  alt: z.string().max(250).optional(),
  altText: z.string().max(250).optional(),
});

const designerBaseSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  brandName: z.string().trim().min(1, "Brand name is required"),
  avatar: designerImageSchema.optional(),
  brandImage: designerImageSchema.optional(),
  bannerImage: designerImageSchema.optional(),
  isFavorite: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const createDesignerSchema = designerBaseSchema;

export const updateDesignerSchema = designerBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });
