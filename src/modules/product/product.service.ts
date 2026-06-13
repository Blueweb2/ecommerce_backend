import { Product } from "./product.model";
import { CreateProductDTO, UpdateProductDTO } from "./product.types";
import { AppError } from "../../utils/AppError";
import { deleteImageFromCloudinary } from "../cloudinary/cloudinary.service";
import { generateSmartSKU } from "../../utils/sku/sku.generator";
import { toStringId } from "../../utils/common/toStringId";
import slugify from "slugify";
import mongoose from "mongoose";
import { normalize as normAttr, normalizeKey } from "../../utils/attributes";


type GetSaleProductsParams = {
  page?: number;
  limit?: number;
  sort?: string;
};

type GetNewProductsParams = {
  limit?: number;
};


export const getRelatedProductsService = async (productId: string) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError("Invalid product ID", 400);
  }

  const currentProduct = await Product.findById(productId);

  if (!currentProduct) {
    throw new AppError("Product not found", 404);
  }

  const minPrice = currentProduct.price * 0.7;
  const maxPrice = currentProduct.price * 1.3;

  let products: any[] = [];
  const addedIds = new Set<string>();

  // 🔥 HELPER FUNCTION (PREVENT DUPLICATES EARLY)
  const addProducts = (items: any[]) => {
    for (const item of items) {
      const id = item._id.toString();

      if (!addedIds.has(id)) {
        products.push(item);
        addedIds.add(id);
      }

      if (products.length >= 10) break;
    }
  };

  // 🔥 PRIORITY 1 → SAME CATEGORY
  const categoryProducts = await Product.find({
    _id: { $ne: currentProduct._id },
    category: currentProduct.category,
    isPublished: true,
  })
    .limit(10)
    .select("name slug price discountPrice images brand")
    .lean();

  addProducts(categoryProducts);

  // 🔥 PRIORITY 2 → BRAND
  if (products.length < 10 && currentProduct.brand) {
    const brandProducts = await Product.find({
      _id: { $ne: currentProduct._id },
      brand: currentProduct.brand,
      isPublished: true,
    })
      .limit(10)
      .select("name slug price discountPrice images brand")
      .lean();

    addProducts(brandProducts);
  }

  // 🔥 PRIORITY 3 → PRICE RANGE
  if (products.length < 10) {
    const priceProducts = await Product.find({
      _id: { $ne: currentProduct._id },
      price: { $gte: minPrice, $lte: maxPrice },
      isPublished: true,
    })
      .limit(10)
      .select("name slug price discountPrice images brand")
      .lean();

    addProducts(priceProducts);
  }

  return products;
};

export const getSaleProductsService = async ({
  page = 1,
  limit = 20,
  sort = "createdAt-desc",
}: GetSaleProductsParams) => {
  const skip = (page - 1) * limit;

  // Map sort strings to MongoDB sort objects
  let sortOption: any = { createdAt: -1 };
  if (sort === "price-asc") sortOption = { discountPrice: 1 };
  if (sort === "price-desc") sortOption = { discountPrice: -1 };
  if (sort === "createdAt-desc" || sort === "-createdAt") sortOption = { createdAt: -1 };

  // 🔥 Filter only sale products
  const filter = {
    isOnSale: true,
    isPublished: true, // ✅ MUST BE PUBLISHED
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category") // ✅ POPULATE FOR CONSISTENCY
      .populate("designer") // ✅ Added
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getNewProductsService = async ({
  limit = 8,
}: GetNewProductsParams = {}) => {
  const normalizedLimit = Math.min(Math.max(limit, 8), 12);

  return Product.find({
    isPublished: true,
    sections: "new-in",
  })
    .select("_id name slug price discountPrice images brand description")
    .populate("designer", "name brandName")
    .sort({ createdAt: -1 })
    .limit(normalizedLimit)
    .lean();
};


// 🔹 Normalize attributes (important for comparison)
const isMapLike = (
  value: Record<string, unknown> | Map<string, unknown>
): value is Map<string, unknown> => {
  return typeof (value as { entries?: unknown }).entries === "function";
};

const toPlainAttributes = (
  attrs?: Record<string, unknown> | Map<string, unknown>
) => {
  if (!attrs) {
    return {};
  }

  if (attrs instanceof Map) {
    return Object.fromEntries(attrs.entries());
  }

  if (isMapLike(attrs)) {
    return Object.fromEntries(Array.from(attrs.entries()));
  }

  return attrs;
};

const normalizeAttributes = (
  attrs?: Record<string, unknown> | Map<string, unknown>
) => {
  const plainAttributes = toPlainAttributes(attrs);
  const keys = Object.keys(plainAttributes);

  if (keys.length === 0) {
    return "{}";
  }

  return JSON.stringify(
    keys.sort().reduce((acc, key) => {
      const normalizedKey = key.trim().toLowerCase();
      acc[normalizedKey] = String(plainAttributes[key] ?? "")
        .trim()
        .toLowerCase();
      return acc;
    }, {} as Record<string, string>)
  );
};

export const validateProductAttributesAndVariants = (
  attributes: { name: string; values: string[] }[] | undefined,
  variants: any[] | undefined
) => {
  const hasAttributes = attributes && attributes.length > 0;
  const hasVariants = variants && variants.length > 0;

  if (hasAttributes && !hasVariants) {
    throw new AppError("Variants must be provided when product has attributes", 400);
  }

  if (!hasAttributes && hasVariants) {
    throw new AppError("Product cannot have variants without attributes", 400);
  }

  if (hasAttributes && variants) {
    const validAttrKeys = new Set(
      attributes.map((attr) => normalizeKey(attr.name))
    );

    const validAttrValuesMap = new Map<string, Set<string>>();
    attributes.forEach((attr) => {
      const normKey = normalizeKey(attr.name);
      const valSet = new Set(attr.values.map((v) => normAttr(v)));
      validAttrValuesMap.set(normKey, valSet);
    });

    for (const variant of variants) {
      const varAttrs = variant.attributes || {};
      const varKeys = Object.keys(varAttrs);

      if (varKeys.length === 0) {
        throw new AppError("Variants must contain attributes when product has attributes", 400);
      }

      // Check keys and values
      for (const key of varKeys) {
        const normKey = normalizeKey(key);
        if (!validAttrKeys.has(normKey)) {
          throw new AppError(`Invalid attribute key: ${key}`, 400);
        }

        const val = normAttr(String(varAttrs[key] || ""));
        const validValues = validAttrValuesMap.get(normKey);
        if (!validValues || !validValues.has(val)) {
          throw new AppError(`Invalid value '${varAttrs[key]}' for attribute '${key}'`, 400);
        }
      }

      // Ensure variant has all product attributes
      for (const reqKey of validAttrKeys) {
        const variantHasKey = varKeys.some((k) => normalizeKey(k) === reqKey);
        if (!variantHasKey) {
          throw new AppError(`Variant missing required attribute: ${reqKey}`, 400);
        }
      }
    }
  }
};

//   const baseSlug = slugify(data.name, { lower: true, strict: true });

//   let slug = baseSlug;
//   let counter = 1;

//   while (await Product.findOne({ slug })) {
//     slug = `${baseSlug}-${counter++}`;
//   }

//   // 🔥 Validate attribute keys
//   if (data.attributes && data.variants) {
//     const validAttributes = new Set(data.attributes.map((a) => a.name));

//     for (const variant of data.variants) {
//       for (const key of Object.keys(variant.attributes || {})) {
//         if (!validAttributes.has(key)) {
//           throw new AppError(`Invalid attribute: ${key}`, 400);
//         }
//       }
//     }
//   }

//   if (!data.variants?.length) {
//   data.sku = await generateSmartSKU({
//     category: data.category,
//     brand: data.brand,
//     attributes: {},
//   });
// }

//   // 🔥 Process variants
//   let processedVariants: any[] = [];

//   if (data.variants?.length) {
//     const seen = new Set();

//     for (const variant of data.variants) {
//       const normalizedAttrs = Object.fromEntries(
//         Object.entries(variant.attributes || {}).map(([k, v]) => [
//           k.trim().toLowerCase(),
//           v.trim().toLowerCase(),
//         ])
//       );

//       const key = normalizeAttributes(normalizedAttrs);

//       if (seen.has(key)) {
//         throw new AppError("Duplicate variant combination", 400);
//       }
//       seen.add(key);

//       const sku = await generateSmartSKU({
//         category: data.category,
//         brand: data.brand,
//         attributes: normalizedAttrs,
//       });

//       processedVariants.push({
//         ...variant,
//         attributes: normalizedAttrs,
//         sku,
//       });
//     }

//     // 🔥 Auto stock
//     data.stock =
//       processedVariants.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
//   }

//   return await Product.create({
//     ...data,
//     slug,
//     variants: processedVariants,
//   });
// };

export const createProduct = async (data: CreateProductDTO) => {
  //  SLUG
  const baseSlug = slugify(data.name, { lower: true, strict: true });

  let slug = baseSlug;
  let counter = 1;

  while (await Product.findOne({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  //  Validate attributes and variants
  validateProductAttributesAndVariants(data.attributes, data.variants);

  // ===============================
  //  PROCESS VARIANTS FIRST
  // ===============================
  let processedVariants: any[] = [];

  if (data.variants?.length) {
    const seen = new Set();

    for (const variant of data.variants) {
      const normalizedAttrs = Object.fromEntries(
        Object.entries(variant.attributes || {}).map(([k, v]) => [
          k.trim().toLowerCase(),
          v.trim().toLowerCase(),
        ])
      );

      const key = normalizeAttributes(normalizedAttrs);

      if (seen.has(key)) {
        throw new AppError("Duplicate variant combination", 400);
      }
      seen.add(key);

      const sku = await generateSmartSKU({
        category: data.category,
        brand: data.brand,
        attributes: normalizedAttrs,
      });

      processedVariants.push({
        ...variant,
        attributes: normalizedAttrs,
        sku,
      });
    }

    //  auto stock
    data.stock =
      processedVariants.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;

    // ❗ VERY IMPORTANT
    delete data.sku;
  } else {
    //  product-level SKU
    data.sku = await generateSmartSKU({
      category: data.category,
      brand: data.brand,
      attributes: {},
    });
  }

  // FINAL SAFETY (avoid null SKU crash)
  if (!data.sku) {
    delete data.sku;
  }

  // ===============================
  // ✅ VALIDATE CUSTOMIZATION
  // ===============================
  if (data.customizable?.isCustomizable) {
    if (!data.customizable.fields || data.customizable.fields.length === 0) {
      throw new AppError("Custom fields required", 400);
    }

    const seenFields = new Set();

    for (const field of data.customizable.fields) {
      const name = field.name.trim().toLowerCase();

      if (seenFields.has(name)) {
        throw new AppError(`Duplicate custom field: ${name}`, 400);
      }

      seenFields.add(name);

      // ✅ normalize
      field.name = name;

      // ✅ validate select type
      if (field.type === "select") {
        if (!field.options || field.options.length === 0) {
          throw new AppError(
            `Options required for select field: ${field.name}`,
            400
          );
        }
      }
    }
  }

  // ===============================
  // SAVE PRODUCT
  // ===============================
  return await Product.create({
    ...data,
    slug,
    variants: processedVariants,
  });
};



export const getFeaturedProducts = async () => {
  return await Product.find({
    sections: "featured",
    isPublished: true,
  }).sort({ createdAt: -1 });
};


// export const searchProducts = async (query: string) => {
//   return await Product.find({
//     $and: [
//       { isPublished: true },
//       {
//         $or: [
//           { name: { $regex: query, $options: "i" } },
//           { description: { $regex: query, $options: "i" } },
//           { brand: { $regex: query, $options: "i" } },
//         ]
//       }
//     ],
//   }).sort({ createdAt: -1 });
// };

export const searchProducts = async (
  query: string
) => {
  console.log("SEARCH QUERY:", query);

  const products = await Product.find({
    isPublished: true,
    $or: [
      {
        name: {
          $regex: query,
          $options: "i",
        },
      },
      {
        description: {
          $regex: query,
          $options: "i",
        },
      },
      {
        brand: {
          $regex: query,
          $options: "i",
        },
      },
    ],
  });

  console.log(
    "FOUND PRODUCTS:",
    products.length
  );

  return products;
};


export const deleteSingleImage = async (
  productId: string,
  imageId: string
) => {
  const product = await Product.findById(productId);

  if (!product) return null;

  // remove image by _id
  product.images = product.images.filter(
    (img: any) => img._id.toString() !== imageId
  );

  await product.save();

  return product;
};

// ======================================================
//  UPDATE PRODUCT
// ======================================================

export const updateProduct = async (
  id: string,
  data: UpdateProductDTO
) => {
  const existing = await Product.findById(id);

  if (!existing) {
    throw new AppError("Product not found", 404);
  }

  //  Handle image replacement
  if (data.images && existing.images) {
    for (const img of existing.images) {
      if (img.public_id) {
        await deleteImageFromCloudinary(img.public_id);
      }
    }
  }

  const attributeSource = data.attributes ?? existing.attributes;

  if (data.variants) {
    validateProductAttributesAndVariants(attributeSource, data.variants);
  }

  //  Handle variants
  if (data.variants?.length) {
    const updatedVariants = [];
    const seen = new Set();

    for (const newVariant of data.variants) {
      const normalizedAttrs = Object.fromEntries(
        Object.entries(newVariant.attributes || {}).map(([k, v]) => [
          k.trim().toLowerCase(),
          String(v).trim().toLowerCase(),
        ])
      );

      const key = normalizeAttributes(normalizedAttrs);

      //  duplicate
      if (seen.has(key)) {
        throw new AppError("Duplicate variant combination", 400);
      }
      seen.add(key);

      // 🔍 Check if exists
      const match = (existing.variants || []).find((v) => {
        if (!v || !v.attributes) return false;

        return normalizeAttributes(v.attributes) === key;
      });

      if (match) {
        // keep old SKU
        updatedVariants.push({
          ...newVariant,
          attributes: normalizedAttrs,
          sku: match.sku,
        });
      } else {
        //  generate new SKU
        const sku = await generateSmartSKU({
          category: data.category
            ? data.category
            : toStringId(existing.category),
          brand: data.brand || existing.brand,
          attributes: normalizedAttrs,
        });

        updatedVariants.push({
          ...newVariant,
          attributes: normalizedAttrs,
          sku,
        });
      }
    }

    data.variants = updatedVariants;

    //  recalc stock
    data.stock = updatedVariants.reduce(
      (sum, v) => sum + (v.stock || 0),
      0
    );
  }

  // ✅ VALIDATE CUSTOMIZATION
  if (data.customizable?.isCustomizable) {
    if (!data.customizable.fields || data.customizable.fields.length === 0) {
      throw new AppError("Custom fields required", 400);
    }

    const seenFields = new Set();

    for (const field of data.customizable.fields) {
      const name = field.name.trim().toLowerCase();

      if (seenFields.has(name)) {
        throw new AppError(`Duplicate custom field: ${name}`, 400);
      }

      seenFields.add(name);

      // ✅ normalize
      field.name = name;

      // ✅ validate select type
      if (field.type === "select") {
        if (!field.options || field.options.length === 0) {
          throw new AppError(
            `Options required for select field: ${field.name}`,
            400
          );
        }
      }
    }
  }

  return await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate("category").populate("designer");
};



// ======================================================
//  GET METHODS
// ======================================================

export const getAllProducts = async (
  page = 1,
  limit = 10,
  filters?: any,
  sort?: string
) => {
  const query: any = {};

  if (filters?.category) query.category = filters.category;
  if (filters?.sections) query.sections = { $in: filters.sections };
  if (typeof filters?.isPublished !== "undefined") {
    query.isPublished = filters.isPublished;
  }

  const skip = (page - 1) * limit;

  let sortOption: any = { createdAt: -1 };
  if (sort === "price-asc") sortOption = { price: 1 };
  if (sort === "price-desc") sortOption = { price: -1 };

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category")
      .populate("designer")
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
  return await Product.findById(id).populate("category").populate("designer");
};

export const getProductBySlug = async (slug: string) => {
  return await Product.findOne({ slug }).populate("category").populate("designer");
};

export const deleteProduct = async (id: string) => {
  return await Product.findByIdAndDelete(id);
};

export const getProductVariants = async (productId: string) => {
  const product = await Product.findById(productId);
  return product?.variants || [];
};

export const updateProductStock = async (
  productId: string,
  newStock: number,
  variantSKU?: string
) => {
  if (variantSKU) {
    const product = await Product.findOne({
      _id: productId,
      "variants.sku": variantSKU,
    }).populate("category").populate("designer");

    if (!product) {
      return null;
    }

    const variant = product.variants.find((item) => item.sku === variantSKU);

    if (!variant) {
      return null;
    }

    variant.stock = newStock;
    product.stock = product.variants.reduce(
      (sum, item) => sum + (item.stock || 0),
      0
    );

    await product.save();
    return product;
  }

  return await Product.findByIdAndUpdate(
    productId,
    { stock: newStock },
    { new: true, runValidators: true }
  ).populate("category").populate("designer");
};
