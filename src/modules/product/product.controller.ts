import { Request, Response } from "express";
import * as categoryService from "../category/category.service";
import { Category } from "../category/category.model";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/response";
import { Product } from "./product.model";
import {
  createProductSchema,
  updateProductSchema,
} from "./product.schema";
import { ProductActorContext } from "./product.authorization";
import * as productService from "./product.service";
import {
  getNewProductsService,
  getRelatedProductsService,
  getSaleProductsService,
} from "./product.service";

const asString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
};

const getParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

const getProductActorFromRequest = (
  req: Request
): ProductActorContext | undefined => {
  const userRole = req.user?.role;

  if (userRole === "admin" || userRole === "superadmin") {
    return { role: userRole };
  }

  if (req.designer?.id) {
    return {
      role: "designer",
      designerId: req.designer.id,
    };
  }

  return undefined;
};

const parseJsonField = <T>(value: unknown): T | unknown => {
  if (typeof value !== "string") return value;

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  try {
    return JSON.parse(trimmedValue) as T;
  } catch {
    return value;
  }
};

const parseStringArrayField = (value: unknown): string[] | undefined => {
  const parsedValue = parseJsonField<unknown>(value);

  if (parsedValue === undefined) {
    return undefined;
  }

  if (Array.isArray(parsedValue)) {
    return parsedValue.map(String);
  }

  if (typeof parsedValue === "string") {
    return [parsedValue];
  }

  return undefined;
};

const parseFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  return undefined;
};

const parseProductPayload = (raw: Record<string, unknown>) => ({
  ...raw,
  attributes: parseJsonField(raw.attributes),
  variants: parseJsonField(raw.variants),
  images: parseJsonField(raw.images),
  customizable: parseJsonField(raw.customizable),
  specifications: parseJsonField(raw.specifications),
  sections: parseStringArrayField(raw.sections),
  keyFeatures: parseStringArrayField(raw.keyFeatures),
});

const resolveVariantForClient = (
  product: Record<string, any>,
  variant: Record<string, any>
) => {
  const productImages = Array.isArray(product.images) ? product.images : [];
  const variantImages = Array.isArray(variant.images) ? variant.images : [];
  const hasOwnImages = variantImages.length > 0;
  const hasOwnPrice = typeof variant.price === "number";
  const hasOwnDiscountPrice = typeof variant.discountPrice === "number";

  return {
    ...variant,
    price: hasOwnPrice ? variant.price : product.price,
    discountPrice: hasOwnDiscountPrice
      ? variant.discountPrice
      : product.discountPrice,
    images: hasOwnImages ? variantImages : productImages,
    hasOwnImages,
    hasOwnPrice,
    hasOwnDiscountPrice,
  };
};

const serializeProductForClient = (product: any) => {
  if (!product) {
    return product;
  }

  const plainProduct =
    typeof product?.toObject === "function" ? product.toObject() : product;

  return {
    ...plainProduct,
    variants: Array.isArray(plainProduct.variants)
      ? plainProduct.variants.map((variant: Record<string, any>) =>
          resolveVariantForClient(plainProduct, variant)
        )
      : [],
  };
};

export const getRelatedProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const products = await getRelatedProductsService(id);

    res.json({
      success: true,
      data: products.map((product: any) => serializeProductForClient(product)),
    });
  }
);



export const getSaleProducts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const sort = (req.query.sort as string) || "-createdAt";

    const result = await getSaleProductsService({
      page,
      limit,
      sort,
    });

    res.status(200).json({
      success: true,
      message: "Sale products fetched successfully",
      data: result.products.map((product: any) =>
        serializeProductForClient(product)
      ),
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("getSaleProducts error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch sale products",
    });
  }
};

export const createProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const raw = req.body as Record<string, unknown>;
    const parsedBody = parseProductPayload(raw);
    const validatedData = createProductSchema.parse(parsedBody);
    const product = await productService.createProduct(
      validatedData,
      getProductActorFromRequest(req)
    );

    sendResponse(
      res,
      201,
      "Product created successfully",
      serializeProductForClient(product)
    );
  }
);

export const getProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const filters: Record<string, unknown> = {};
    const categorySlug = asString(req.query.category);

    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug });

      if (!category) {
        return sendResponse(res, 200, "No products found", {
          products: [],
          pagination: { total: 0, page, limit, pages: 0 },
        });
      }

      const allCategoryIds = await categoryService.getCategoryDescendants(
        category._id.toString()
      );

      filters.category = { $in: allCategoryIds };
    }

    const sections = asString(req.query.sections);
    if (sections) {
      filters.sections = sections.split(",").map((section) => section.trim());
    }

    if (typeof req.query.isPublished !== "undefined") {
      filters.isPublished = req.query.isPublished === "true";
    }

    const sort = asString(req.query.sort);
    const result = await productService.getAllProducts(
      page,
      limit,
      filters,
      sort
    );

    sendResponse(res, 200, "Products fetched successfully", {
      ...result,
      products: result.products.map((product: any) =>
        serializeProductForClient(product)
      ),
    });
  }
);

export const getProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParam(req.params.id);
    const product = await productService.getProductById(id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(
      res,
      200,
      "Product fetched successfully",
      serializeProductForClient(product)
    );
  }
);

export const getProductBySlugHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const slug = getParam(req.params.slug);
    const product = await productService.getProductBySlug(slug);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(
      res,
      200,
      "Product fetched successfully",
      serializeProductForClient(product)
    );
  }
);

export const updateProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParam(req.params.id);
    const raw = req.body as Record<string, unknown>;
    const parsedBody = parseProductPayload(raw);
    const validatedData = updateProductSchema.parse(parsedBody);
    const product = await productService.updateProduct(
      id,
      validatedData,
      getProductActorFromRequest(req)
    );

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(
      res,
      200,
      "Product updated successfully",
      serializeProductForClient(product)
    );
  }
);

export const deleteProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParam(req.params.id);
    const product = await productService.deleteProduct(id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(res, 200, "Product deleted successfully");
  }
);

export const searchProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = asString(req.query.q);

    if (!query || query.trim() === "") {
      throw new AppError("Search query is required", 400);
    }

    const products = await productService.searchProducts(query);
    sendResponse(
      res,
      200,
      "Search results",
      products.map((product: any) => serializeProductForClient(product))
    );
  }
);

export const getFeaturedProductsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const products = await productService.getFeaturedProducts();
    sendResponse(
      res,
      200,
      "Featured products fetched",
      products.map((product: any) => serializeProductForClient(product))
    );
  }
);

export const getNewProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit) ? requestedLimit : 8;
    const products = await getNewProductsService({ limit });

    sendResponse(
      res,
      200,
      "New in products fetched",
      products.map((product: any) => serializeProductForClient(product))
    );
  }
);

export const getProductVariantsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParam(req.params.id);
    const product = await productService.getProductById(id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const variants = serializeProductForClient(product).variants;

    sendResponse(res, 200, "Product variants fetched", variants);
  }
);

export const updateProductStockHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParam(req.params.id);
    const variantSKU = asString(req.body.variantSKU);
    const stock = parseFiniteNumber(req.body.stock);

    if (stock === undefined || stock < 0) {
      throw new AppError("Invalid stock value", 400);
    }

    const product = await productService.updateProductStock(
      id,
      stock,
      variantSKU
    );

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(
      res,
      200,
      "Stock updated successfully",
      serializeProductForClient(product)
    );
  }
);

export const setPrimaryImageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId, imageId } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    product.images.forEach((img: any) => {
      img.isPrimary = img._id.toString() === imageId;
    });

    await product.save();
    sendResponse(res, 200, "Primary image updated");
  }
);

export const deleteSingleImageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = getParam(req.params.productId);
    const imageId = getParam(req.params.imageId);

    if (!productId || !imageId) {
      throw new AppError("Product ID and Image ID are required", 400);
    }

    const product = await productService.deleteSingleImage(productId, imageId);
    sendResponse(res, 200, "Image deleted successfully", product);
  }
);
