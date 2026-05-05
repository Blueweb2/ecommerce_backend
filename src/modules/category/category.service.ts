import mongoose from "mongoose";
import slugify from "slugify";

import { Category } from "./category.model";
import { Product } from "../product/product.model";
import { Collection } from "../collection/collection.model";
import { AppError } from "../../utils/AppError";

type CategoryImageInput = {
  url: string;
  public_id: string;
  altText?: string;
};

type CategoryCustomFieldInput = {
  name: string;
  type: "text" | "number" | "select";
  required?: boolean;
  options?: string[];
  unit?: string;
};

type CategoryPayload = {
  name?: string;
  description?: string;
  image?: CategoryImageInput;
  parent?: string | null;
  isActive?: boolean;
  isCustomizable?: boolean;
  customFields?: CategoryCustomFieldInput[];
  slug?: string;
  level?: number;
};

const ensureValidCategoryId = (id: string, label = "category ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
};

const normalizeParentId = (parent?: string | null) => parent || null;

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

const assertValidParent = async (
  categoryId: string,
  parentId: string | null
) => {
  if (!parentId) {
    return 0;
  }

  ensureValidCategoryId(parentId, "parent category ID");

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
      throw new AppError(
        "Category cannot be moved under its own descendant",
        400
      );
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

const assertCustomizableState = (
  isCustomizable: boolean,
  customFields?: CategoryCustomFieldInput[]
) => {
  if (isCustomizable && (!customFields || customFields.length === 0)) {
    throw new AppError(
      "Custom fields required when category is customizable",
      400
    );
  }
};

export const createCategory = async (data: CategoryPayload) => {
  const { name } = data;
  const parent = normalizeParentId(data.parent);

  if (!name) {
    throw new AppError("Category name is required", 400);
  }

  assertCustomizableState(data.isCustomizable ?? false, data.customFields);
  await ensureUniqueCategoryName(name, parent);

  const baseSlug = slugify(name, { lower: true, strict: true });
  const slug = await buildUniqueSlug(baseSlug);
  const level = await assertValidParent("", parent);

  const category = await Category.create({
    ...data,
    parent,
    slug,
    level,
  });

  return category;
};

export const getCategoryTree = async () => {
  const categories = await Category.find({ isActive: true })
    .sort({ name: 1 })
    .lean();

  const map: Record<string, { children: unknown[] } & Record<string, unknown>> =
    {};
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
  return Category.find({ isActive: true }).sort({ name: 1 });
};

export const getCategoryById = async (id: string) => {
  ensureValidCategoryId(id);
  return Category.findById(id);
};

export const getCategoryBySlug = async (slug: string) => {
  return Category.findOne({ slug });
};

export const updateCategory = async (id: string, data: CategoryPayload) => {
  ensureValidCategoryId(id);

  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const nextName = data.name ?? category.name;
  const currentParentId = category.parent ? category.parent.toString() : null;
  const nextParentId =
    typeof data.parent !== "undefined"
      ? normalizeParentId(data.parent)
      : currentParentId;

  const nextIsCustomizable =
    typeof data.isCustomizable === "boolean"
      ? data.isCustomizable
      : category.isCustomizable;
  const nextCustomFields =
    typeof data.customFields !== "undefined"
      ? data.customFields
      : category.customFields;

  assertCustomizableState(nextIsCustomizable, nextCustomFields);
  await ensureUniqueCategoryName(nextName, nextParentId, id);

  const parentChanged = nextParentId !== currentParentId;

  if (typeof data.name !== "undefined") {
    const baseSlug = slugify(data.name, { lower: true, strict: true });
    category.name = data.name;
    category.slug = await buildUniqueSlug(baseSlug, id);
  }

  if (typeof data.description !== "undefined") {
    category.description = data.description;
  }

  if (typeof data.image !== "undefined") {
    category.image = data.image;
  }

  if (typeof data.isActive === "boolean") {
    category.isActive = data.isActive;
  }

  if (typeof data.isCustomizable === "boolean") {
    category.isCustomizable = data.isCustomizable;
  }

  if (typeof data.customFields !== "undefined") {
    category.customFields = data.customFields;
  }

  if (typeof data.parent !== "undefined") {
    const level = await assertValidParent(id, nextParentId);
    category.parent = nextParentId
      ? new mongoose.Types.ObjectId(nextParentId)
      : null;
    category.level = level;
  }

  await category.save();

  if (parentChanged) {
    await updateDescendantLevels(category._id.toString(), category.level);
  }

  return category;
};

export const deleteCategory = async (id: string) => {
  ensureValidCategoryId(id);

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

  const hasCollections = await Collection.findOne({ category: id }).select("_id");

  if (hasCollections) {
    throw new AppError("Cannot delete category with linked collections", 400);
  }

  await Category.findByIdAndDelete(id);

  return category;
};

export const getCategoryDescendants = async (
  categoryId: string | mongoose.Types.ObjectId
) => {
  let allCategoryIds = [new mongoose.Types.ObjectId(categoryId)];
  let parentIds = [new mongoose.Types.ObjectId(categoryId)];

  while (parentIds.length > 0) {
    const children = await Category.find({ parent: { $in: parentIds } })
      .select("_id")
      .lean();

    if (children.length === 0) break;

    const childIds = children.map((child) => child._id as mongoose.Types.ObjectId);
    allCategoryIds.push(...childIds);
    parentIds = childIds;
  }

  return allCategoryIds;
};
