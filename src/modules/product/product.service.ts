import Product from "./product.model";
import { CreateProductDTO, UpdateProductDTO } from "./product.types";
import { AppError } from "../../utils/AppError";
import { deleteImageFromCloudinary } from "../cloudinary/cloudinary.service";


// Generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// Generate unique SKU: CATEGORY_PREFIX-BRAND_PREFIX-RANDOM_NUMBER
const generateSKU = (categoryName?: string, brandName?: string): string => {
  const categoryPrefix = (categoryName || "GEN").substring(0, 3).toUpperCase();
  const brandPrefix = (brandName || "GEN").substring(0, 3).toUpperCase();
  const randomNumber = Math.floor(1000 + Math.random() * (9999 - 1000 + 1));
  return `${categoryPrefix}-${brandPrefix}-${randomNumber}`;
};

export const createProduct = async (data: CreateProductDTO) => {
  const slug = generateSlug(data.name);
  
  // Check if slug already exists
  const existingProduct = await Product.findOne({ slug });
  if (existingProduct) {
    throw new AppError("A product with this name already exists", 409);
  }

  // Generate or use provided SKU
  let sku = data.sku;
  if (!sku) {
    // Generate SKU with retry logic in case of collision
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
      sku = generateSKU(data.category, data.brand);
      const existingSKU = await Product.findOne({ sku });
      if (!existingSKU) break;
      attempts++;
    }
    if (attempts === maxAttempts) {
      throw new AppError("Could not generate unique SKU", 500);
    }
  } else {
    // Check if provided SKU already exists
    const existingSKU = await Product.findOne({ sku });
    if (existingSKU) {
      throw new AppError("SKU already exists", 409);
    }
  }

  // Handle variants - generate SKUs if not provided
  const processedVariants = data.variants?.map((variant) => {
    if (!variant.sku) {
      // Generate variant SKU: BASE_PRODUCT_SKU-SIZE-COLOR
      const sizePrefix = variant.size ? variant.size.substring(0, 2).toUpperCase() : "XX";
      const colorPrefix = variant.color ? variant.color.substring(0, 2).toUpperCase() : "XX";
      variant.sku = `${sku}-${sizePrefix}-${colorPrefix}`;
    }
    return variant;
  });

  return await Product.create({ ...data, slug, sku, variants: processedVariants });
};

export const getAllProducts = async (
  page: number = 1,
  limit: number = 10,
  filters?: any,
  sort?: string
) => {
  const query: any = { isPublished: true };

  if (filters) {
    if (filters.category) query.category = filters.category;
    if (filters.sections) query.sections = { $in: filters.sections };
    if (typeof filters.isPublished !== "undefined") query.isPublished = filters.isPublished;
  }

  const skip = (page - 1) * limit;

  let sortOption: any = { createdAt: -1 };
  if (sort === "price-asc") sortOption = { price: 1 };
  else if (sort === "price-desc") sortOption = { price: -1 };
  else if (sort === "rating") sortOption = { ratingsAverage: -1 };
  else if (sort === "newest") sortOption = { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category")
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getProductById = async (id: string) => {
  return await Product.findById(id).populate("category");
};

export const deleteProduct = async (id: string) => {
  return await Product.findByIdAndDelete(id);
};

export const searchProducts = async (query: string, limit: number = 10) => {
  return await Product.find(
    {
      $text: { $search: query },
      isPublished: true,
    },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .populate("category")
    .limit(limit);
};

export const getFeaturedProducts = async (limit: number = 10) => {
  return await Product.find({
    isPublished: true,
    sections: { $in: ["featured"] },
  })
    .populate("category")
    .sort({ createdAt: -1 })
    .limit(limit);
};

export const getProductBySlug = async (slug: string) => {
  return await Product.findOne({ slug, isPublished: true }).populate("category");
};

export const getProductVariants = async (productId: string) => {
  const product = await Product.findById(productId);
  return product?.variants || [];
};

export const getVariantBySKU = async (sku: string) => {
  // Find product that contains this variant SKU
  const product = await Product.findOne({
    "variants.sku": sku,
    isPublished: true,
  }).populate("category");

  if (!product) return null;

  // Find the specific variant
  const variant = product.variants.find(v => v.sku === sku);
  return variant ? { product, variant } : null;
};

export const updateProductStock = async (productId: string, newStock: number, variantSKU?: string) => {
  if (variantSKU) {
    // Update variant stock
    return await Product.findOneAndUpdate(
      { _id: productId, "variants.sku": variantSKU },
      { $set: { "variants.$.stock": newStock } },
      { new: true }
    ).populate("category");
  } else {
    // Update main product stock
    return await Product.findByIdAndUpdate(
      productId,
      { stock: newStock },
      { new: true }
    ).populate("category");
  }
};


export const updateProduct = async (id: string, data: UpdateProductDTO) => {
  const existingProduct = await Product.findById(id);

  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  // 🔥 Delete old images if new ones provided
  if (data.images && existingProduct.images) {
    for (const img of existingProduct.images) {
      if (img.public_id) {
        await deleteImageFromCloudinary(img.public_id);
      }
    }
  }

  const updated = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  })
    .populate("category");

  return updated;
};

const setPrimaryImage = (images: any[]) => {
  if (!images || images.length === 0) return images;

  // If no primary → set first as primary
  const hasPrimary = images.some((img) => img.isPrimary);

  if (!hasPrimary) {
    images[0].isPrimary = true;
  }

  return images;
};


// Delete Single Image API
export const deleteSingleImage = async (productId: string, imageId: string) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!product.images || product.images.length === 0) {
    throw new AppError("No images found", 400);
  }

  // Find image to delete
  const imageToDelete = product.images.find(
    (img: any) => img._id.toString() === imageId
  );

  if (!imageToDelete) {
    throw new AppError("Image not found", 404);
  }

  // 🔥 Delete from Cloudinary
  if (imageToDelete.public_id) {
    await deleteImageFromCloudinary(imageToDelete.public_id);
  }

  // Remove from DB
  product.images = product.images.filter(
    (img: any) => img._id.toString() !== imageId
  );

  // 🔥 Ensure one primary image exists
  if (product.images.length > 0) {
    const hasPrimary = product.images.some((img: any) => img.isPrimary);

    if (!hasPrimary) {
      product.images[0].isPrimary = true;
    }
  }

  await product.save();

  return product;
};