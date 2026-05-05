import { SortOrder, Types } from "mongoose";

import { Category } from "../category/category.model";
import { getCategoryDescendants } from "../category/category.service";
import { Product } from "../product/product.model";
import { AppError } from "../../utils/AppError";
import { Collection } from "./collection.model";

type CreateCollectionInput = {
  title: string;
  slug: string;
  description?: string;
  category: string;
  image?: {
    url: string;
    public_id?: string;
    altText?: string;
  };
  cta?: string;
  priority?: number;
  isActive?: boolean;
};

type CollectionProductsOptions = {
  page?: number;
  limit?: number;
  sort?: string;
};

const buildSortOption = (sort?: string): Record<string, SortOrder> => {
  switch (sort) {
    case "price-asc":
      return { price: 1 };
    case "price-desc":
      return { price: -1 };
    case "createdAt-asc":
      return { createdAt: 1 };
    case "createdAt-desc":
    default:
      return { createdAt: -1 };
  }
};

const validateCategoryReference = async (categoryId: string) => {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new AppError("Invalid category ID", 400);
  }

  const category = await Category.findById(categoryId).select("_id").lean();
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return new Types.ObjectId(categoryId);
};

export const getActiveCollections = async () => {
  return Collection.find({ isActive: true })
    .populate("category")
    .sort({ priority: -1, createdAt: -1 })
    .lean();
};

export const createCollection = async (data: CreateCollectionInput) => {
  const normalizedSlug = data.slug.trim().toLowerCase();
  const categoryId = await validateCategoryReference(data.category);

  const existing = await Collection.findOne({ slug: normalizedSlug })
    .select("_id")
    .lean();
  if (existing) {
    throw new AppError("Collection slug already exists", 409);
  }

  const collection = await Collection.create({
    ...data,
    category: categoryId,
    slug: normalizedSlug,
  });

  return collection.populate("category");
};

export const getCollectionProductsBySlug = async (
  slug: string,
  { page = 1, limit = 12, sort = "createdAt-desc" }: CollectionProductsOptions = {}
) => {
  const collection = await Collection.findOne({
    slug,
    isActive: true,
  })
    .populate("category")
    .lean();

  if (!collection) {
    throw new AppError("Collection not found", 404);
  }

  if (!collection.category) {
    throw new AppError("Collection category reference is invalid", 409);
  }

  const allCategoryIds = await getCategoryDescendants(collection.category.toString());

  const query = {
    category: { $in: allCategoryIds },
    isPublished: true,
  };

  const sortOption = buildSortOption(sort);

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    collection,
    products,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getCollectionsByCategory = async (categoryId: string) => {
  const validId = await validateCategoryReference(categoryId);

  return Collection.find({
    category: validId,
    isActive: true,
  })
    .sort({ priority: -1, createdAt: -1 })
    .limit(2) // 👈 important for navbar
    .lean();
};

export const getCollectionById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid collection ID", 400);
  }

  const collection = await Collection.findById(id).populate("category").lean();
  if (!collection) {
    throw new AppError("Collection not found", 404);
  }

  return collection;
};

export const updateCollection = async (
  id: string,
  data: Partial<CreateCollectionInput>
) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid collection ID", 400);
  }

  const collection = await Collection.findById(id);
  if (!collection) {
    throw new AppError("Collection not found", 404);
  }

  if (typeof data.slug !== "undefined") {
    const normalizedSlug = data.slug.trim().toLowerCase();
    if (normalizedSlug !== collection.slug) {
      const existing = await Collection.findOne({
        slug: normalizedSlug,
        _id: { $ne: id },
      })
        .select("_id")
        .lean();

      if (existing) {
        throw new AppError("Collection slug already exists", 409);
      }

      collection.slug = normalizedSlug;
    }
  }

  if (typeof data.category !== "undefined") {
    collection.category = await validateCategoryReference(data.category);
  }

  if (typeof data.title !== "undefined") collection.title = data.title;
  if (typeof data.description !== "undefined") {
    collection.description = data.description;
  }
  if (typeof data.image !== "undefined") collection.image = data.image;
  if (typeof data.cta !== "undefined") collection.cta = data.cta;
  if (typeof data.priority !== "undefined") collection.priority = data.priority;
  if (typeof data.isActive === "boolean") collection.isActive = data.isActive;

  await collection.save();
  return collection.populate("category");
};

export const deleteCollection = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid collection ID", 400);
  }

  const collection = await Collection.findByIdAndDelete(id);
  if (!collection) {
    throw new AppError("Collection not found", 404);
  }

  return collection;
};
