import { Product } from "./product.model";
import { CreateProductDTO, UpdateProductDTO } from "./product.types";
import { AppError } from "../../utils/AppError";
import { deleteImageFromCloudinary } from "../cloudinary/cloudinary.service";
import { generateSmartSKU } from "../../utils/sku/sku.generator";
import { toStringId } from "../../utils/common/toStringId";
import slugify from "slugify";


// 🔹 Normalize attributes (important for comparison)
const normalizeAttributes = (attrs?: Record<string, string>) => {
  if (!attrs) return "{}";

  return JSON.stringify(
    Object.keys(attrs)
      .sort()
      .reduce((acc, key) => {
        acc[key] = attrs[key]?.trim().toLowerCase() || "";
        return acc;
      }, {} as Record<string, string>)
  );
};
// 🔹 Generate slug

// ======================================================
//  CREATE PRODUCT
// ======================================================


// export const createProduct = async (data: CreateProductDTO) => {
//   // 🔥 SLUG (correct)
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

  //  Validate attributes
  if (data.attributes && data.variants) {
    const validAttributes = new Set(data.attributes.map((a) => a.name));

    for (const variant of data.variants) {
      for (const key of Object.keys(variant.attributes || {})) {
        if (!validAttributes.has(key)) {
          throw new AppError(`Invalid attribute: ${key}`, 400);
        }
      }
    }
  }

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


export const searchProducts = async (query: string) => {
  return await Product.find({
    $and: [
      { isPublished: true },
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { brand: { $regex: query, $options: "i" } },
        ]
      }
    ],
  }).sort({ createdAt: -1 });
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

  //  Handle variants
  if (data.variants?.length) {
    const updatedVariants = [];
    const seen = new Set();

    for (const newVariant of data.variants) {
      const normalizedAttrs = Object.fromEntries(
        Object.entries(newVariant.attributes || {}).map(([k, v]) => [
          k.trim(),
          v.trim(),
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

  return await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate("category");
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

export const getProductBySlug = async (slug: string) => {
  return await Product.findOne({ slug }).populate("category");
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
    return await Product.findOneAndUpdate(
      { _id: productId, "variants.sku": variantSKU },
      { $set: { "variants.$.stock": newStock } },
      { new: true }
    );
  }

  return await Product.findByIdAndUpdate(
    productId,
    { stock: newStock },
    { new: true }
  );
};