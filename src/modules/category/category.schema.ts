import { z } from "zod";


const customFieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),

  type: z.enum(["text", "number", "select"]),

  required: z.boolean().optional(),

  options: z.array(z.string()).optional(),

  unit: z.string().optional(),
});

const categoryBaseSchema = z
  .object({
    name: z.string().min(2).max(100),

    description: z.string().optional(),

    parent: z
      .union([
        z.string().regex(/^[a-f\d]{24}$/i),
        z.null(),
        z.literal(""),
      ])
      .transform((val) => (val === "" ? null : val))
      .optional(),

    image: z
      .object({
        url: z.string().url(),
        public_id: z.string().min(1),
        altText: z.string().max(250).optional(),
      })
      .optional(),

    isCustomizable: z.boolean().optional().default(false),

    customFields: z.array(customFieldSchema).optional(),

    isActive: z.boolean().optional().default(true),
  })

export const createCategorySchema = categoryBaseSchema.refine(
    (data) => {
      if (data.isCustomizable) {
        return data.customFields && data.customFields.length > 0;
      }
      return true;
    },
    {
      message: "Custom fields required when category is customizable",
      path: ["customFields"],
    }
  );


export const updateCategorySchema = categoryBaseSchema.partial();
