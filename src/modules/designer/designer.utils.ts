import slugify from "slugify";

import { Designer } from "./designer.model";

export const buildDesignerSlugBase = (name: string) =>
  slugify(name, { lower: true, strict: true, trim: true });

export const buildUniqueDesignerSlug = async (
  name: string,
  excludeId?: string
) => {
  const fallbackSlug = `designer-${Date.now()}`;
  const baseSlug = buildDesignerSlugBase(name) || fallbackSlug;
  let slug = baseSlug;
  let counter = 1;

  while (
    await Designer.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

export const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
