import { SortOrder, Types } from "mongoose";

import { Category } from "../category/category.model";
import { getCategoryDescendants } from "../category/category.service";
import { Product, IProduct } from "../product/product.model";
import { AppError } from "../../utils/AppError";
import { Collection } from "./collection.model";

type CreateCollectionInput = {
  title: string;
  slug: string;
  description: string;
  image?: {
    url: string;
    public_id?: string;
    altText?: string;
  };
  filters?: {
    category?: string;
    type?: string;
    tags?: string[];
    priceMin?: number;
    priceMax?: number;
  };
  isActive?: boolean;
};

type CollectionProductsOptions = {
  page?: number;
  limit?: number;
  sort?: string;
};

const resolveCategoryFilter = async (category?: string | Types.ObjectId | any) => {
  if (!category) {
    return undefined;
  }

  if (category instanceof Types.ObjectId) {
    return category;
  }

  const trimmedCategory = typeof category === "string" ? category.trim() : category.toString().trim();
  if (!trimmedCategory) {
    return undefined;
  }

  const bySlug = await Category.findOne({ slug: trimmedCategory }).select("_id").lean();
  if (bySlug?._id) {
    return bySlug._id;
  }

  if (Types.ObjectId.isValid(trimmedCategory)) {
    return new Types.ObjectId(trimmedCategory);
  }

  return trimmedCategory;
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

const buildProductQuery = async (slug: string) => {
  const collection = await Collection.findOne({
    slug,
    isActive: true,
  })
    .populate("filters.category")
    .lean();

  if (!collection) {
    throw new AppError("Collection not found", 404);
  }

  const query: Record<string, any> = {};
  const { filters } = collection;

  const resolvedCategory = await resolveCategoryFilter(filters?.category);
  if (resolvedCategory) {
    // ✅ Support recursive category lookup
    const allCategoryIds = await getCategoryDescendants(resolvedCategory.toString());
    query.category = { $in: allCategoryIds };
  }

  if (filters?.type) {
    query.type = filters.type;
  }

  if (filters?.tags?.length) {
    query.tags = { $in: filters.tags };
  }

  if (
    typeof filters?.priceMin === "number" ||
    typeof filters?.priceMax === "number"
  ) {
    query.price = {};

    if (typeof filters.priceMin === "number") {
      query.price.$gte = filters.priceMin;
    }

    if (typeof filters.priceMax === "number") {
      query.price.$lte = filters.priceMax;
    }
  }

  return { collection, query };
};

export const getActiveCollections = async () => {
  return Collection.find({ isActive: true })
    .populate("filters.category")
    .sort({ createdAt: -1 })
    .lean();
};

export const createCollection = async (data: CreateCollectionInput) => {
  const normalizedSlug = data.slug.trim().toLowerCase();

  const existingCollection = await Collection.findOne({ slug: normalizedSlug })
    .select("_id")
    .lean();

  if (existingCollection) {
    throw new AppError("Collection slug already exists", 409);
  }

  const collection = await Collection.create({
    ...data,
    slug: normalizedSlug,
  });

  return collection.populate("filters.category");
};

export const getCollectionProductsBySlug = async (
  slug: string,
  { page = 1, limit = 12, sort = "createdAt-desc" }: CollectionProductsOptions = {}
) => {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const skip = (safePage - 1) * safeLimit;
  const sortOption = buildSortOption(sort);

  const { collection, query } = await buildProductQuery(slug);

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category")
      .sort(sortOption)
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    collection,
    products,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
    },
  };
};
export const getCollectionById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid collection ID", 400);
  }

  const collection = await Collection.findById(id).populate("filters.category").lean();
  if (!collection) {
    throw new AppError("Collection not found", 404);
  }

  return collection;
};

export const updateCollection = async (id: string, data: Partial<CreateCollectionInput>) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid collection ID", 400);
  }

  const collection = await Collection.findById(id);
  if (!collection) {
    throw new AppError("Collection not found", 404);
  }

  if (data.slug) {
    const normalizedSlug = data.slug.trim().toLowerCase();
    if (normalizedSlug !== collection.slug) {
      const existing = await Collection.findOne({ slug: normalizedSlug, _id: { $ne: id } }).select("_id").lean();
      if (existing) {
        throw new AppError("Collection slug already exists", 409);
      }
      collection.slug = normalizedSlug;
    }
  }

  // Update fields
  if (data.title) collection.title = data.title;
  if (data.description) collection.description = data.description;
  if (data.image) collection.image = data.image;
  if (data.filters) collection.filters = { ...collection.filters, ...data.filters };
  if (typeof data.isActive === "boolean") collection.isActive = data.isActive;

  await collection.save();
  return collection.populate("filters.category");
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
