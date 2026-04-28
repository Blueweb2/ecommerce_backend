import mongoose from "mongoose";
import { Category } from "./category.model";
import { Product } from "../product/product.model";
import { AppError } from "../../utils/AppError";
import slugify from "slugify";

type CategoryImageInput = {
  url: string;
  public_id: string;
  altText?: string;
};

type CategoryPayload = {
  name?: string;
  description?: string;
  image?: CategoryImageInput;
  parent?: string | null;
  isActive?: boolean;
  slug?: string;
  level?: number;
};

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const buildUniqueSlug = async (baseSlug: string, excludeId?: string) => {
  let slug = baseSlug;
  let counter = 1;

  while (
    await Category.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

const ensureUniqueCategoryName = async (
  name: string,
  parent: string | null,
  excludeId?: string
) => {
  const existingCategory = await Category.findOne({
    name,
    parent,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).collation({ locale: "en", strength: 2 });

  if (existingCategory) {
    throw new AppError("Category already exists under this parent", 409);
  }
};

const assertValidParent = async (categoryId: string, parentId: string | null) => {
  if (!parentId) {
    return 0;
  }

  if (categoryId && categoryId === parentId) {
    throw new AppError("Category cannot be its own parent", 400);
  }

  const parentCategory = await Category.findById(parentId);

  if (!parentCategory) {
    throw new AppError("Parent category not found", 404);
  }

  let currentParent = parentCategory.parent;

  while (currentParent) {
    if (currentParent.toString() === categoryId) {
      throw new AppError("Category cannot be moved under its own descendant", 400);
    }

    const ancestor = await Category.findById(currentParent).select("parent");
    currentParent = ancestor?.parent ?? null;
  }

  return parentCategory.level + 1;
};

const updateDescendantLevels = async (categoryId: string, level: number) => {
  const children = await Category.find({ parent: categoryId });

  await Promise.all(
    children.map(async (child) => {
      child.level = level + 1;
      await child.save();
      await updateDescendantLevels(child._id.toString(), child.level);
    })
  );
};

export const createCategory = async (data: CategoryPayload) => {
  const { name, parent } = data;

  if (!name) {
    throw new AppError("Category name is required", 400);
  }

  // ✅ unique name check
  await ensureUniqueCategoryName(name, parent || null);

  // ✅ slug
  const baseSlug = slugify(name, { lower: true, strict: true });
  const slug = await buildUniqueSlug(baseSlug);

  // ✅ level
  const level = await assertValidParent("", parent || null);

  const category = await Category.create({
    ...data,
    parent: parent || null,
    slug,
    level,
  });

  return category;
};

export const getCategoryTree = async () => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();

  const map: Record<string, { children: unknown[] } & Record<string, unknown>> = {};
  const roots: Array<{ children: unknown[] } & Record<string, unknown>> = [];

  categories.forEach((cat) => {
    map[cat._id.toString()] = { ...cat, children: [] };
  });

  categories.forEach((cat) => {
    if (cat.parent) {
      const parentId = cat.parent.toString();
      map[parentId]?.children.push(map[cat._id.toString()]);
    } else {
      roots.push(map[cat._id.toString()]);
    }
  });

  return roots;
};

export const getAllCategories = async () => {
  return await Category.find({ isActive: true }).sort({ name: 1 });
};

export const getCategoryById = async (id: string) => {
  return await Category.findById(id);
};

export const getCategoryBySlug = async (slug: string) => {
  return await Category.findOne({ slug });
};

export const updateCategory = async (id: string, data: any) => {
  if (data.name) {
    let slug = slugify(data.name, { lower: true, strict: true });

    const existingSlug = await Category.findOne({ slug });

    if (existingSlug && existingSlug._id.toString() !== id) {
      slug = `${slug}-${Date.now()}`;
    }

    data.slug = slug;
  }

  const updated = await Category.findByIdAndUpdate(id, data, {
    new: true,
  });

  return updated;
};

export const deleteCategory = async (id: string) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const hasChildren = await Category.findOne({ parent: id }).select("_id");

  if (hasChildren) {
    throw new AppError("Cannot delete category with subcategories", 400);
  }

  const hasProducts = await Product.findOne({ category: id }).select("_id");

  if (hasProducts) {
    throw new AppError("Cannot delete category with linked products", 400);
  }

  await Category.findByIdAndDelete(id);

  return category;
};

/**
 * Get all descendant category IDs recursively including the parent category ID
 */
export const getCategoryDescendants = async (categoryId: string | mongoose.Types.ObjectId) => {
  let allCategoryIds = [new mongoose.Types.ObjectId(categoryId)];
  let parentIds = [new mongoose.Types.ObjectId(categoryId)];

  while (parentIds.length > 0) {
    const children = await Category.find({ parent: { $in: parentIds } }).select("_id").lean();
    if (children.length === 0) break;
    
    const childIds = children.map(c => c._id as mongoose.Types.ObjectId);
    allCategoryIds.push(...childIds);
    parentIds = childIds;
  }

  return allCategoryIds;
};
