import { z } from "zod";

export const createPromoSchema = z.object({
  code: z.string().min(3).max(20).trim().toUpperCase(),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive(),
  minOrderValue: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional(),
  expiresAt: z.string().or(z.date()),
  usageLimit: z.number().int().min(0).default(0),
  isActive: z.boolean().optional().default(true),
});

export const updatePromoSchema = createPromoSchema.partial();

export const validatePromoSchema = z.object({
  code: z.string().min(1).trim().toUpperCase(),
  subtotal: z.number().min(0),
});
