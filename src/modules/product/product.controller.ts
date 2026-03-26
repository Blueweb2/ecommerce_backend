import { Request, Response } from "express";
import * as productService from "./product.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/response";
import Product from "./product.model";


const asString = (
  value?: string | string[]
): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
};
export const createProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await productService.createProduct(req.body);
    sendResponse(res, 201, "Product created successfully", product);
  }
);

export const getProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { category, sections, isPublished, sort } = req.query;

    const toStringValue = (value?: string | string[] | undefined): string | undefined => {
      if (!value) return undefined;
      if (typeof value === "string") return value;
      if (Array.isArray(value) && value.length > 0) return value[0];
      return undefined;
    };

    const filters: any = {};
    if (typeof isPublished !== "undefined") {
      filters.isPublished = isPublished === "true";
    }

    const categoryStr = toStringValue(category as any);
    if (categoryStr) filters.category = categoryStr;

    if (sections) {
      const sectionsString = toStringValue(sections as any);
      const sectionsArray = sectionsString
        ? sectionsString.split(",")
        : Array.isArray(sections)
        ? sections
        : [];

      filters.sections = sectionsArray
        .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
        .filter(Boolean);
    }

    const sortOption = toStringValue(sort as any);

    const result = await productService.getAllProducts(page, limit, filters, sortOption);
    sendResponse(res, 200, "Products fetched successfully", result);
  }
);

export const getProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = req.params.id as string;
    const product = await productService.getProductById(productId);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(res, 200, "Product fetched successfully", product);
  }
);

export const getProductBySlugHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const product = await productService.getProductBySlug(slug);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(res, 200, "Product fetched successfully", product);
  }
);
export const updateProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = req.params.id as string;
    const product = await productService.updateProduct(
      productId,
      req.body
    );

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(res, 200, "Product updated successfully", product);
  }
);

export const deleteProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = req.params.id as string;
    const product = await productService.deleteProduct(productId);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(res, 200, "Product deleted successfully");
  }
);
export const searchProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { q } = req.query;

    // ❌ Missing query
    if (!q) {
      throw new AppError("Search query is required", 400);
    }

    // ✅ Safe string extraction
    const query =
      typeof q === "string"
        ? q
        : Array.isArray(q)
        ? typeof q[0] === "string"
          ? q[0]
          : undefined
        : undefined;

    if (!query || query.trim() === "") {
      throw new AppError("Invalid search query", 400);
    }

    const products = await productService.searchProducts(query);

    sendResponse(res, 200, "Search results", products);
  }
);

export const getFeaturedProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const products = await productService.getFeaturedProducts();
    sendResponse(res, 200, "Featured products fetched", products);
  }
);

export const getProductVariantsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = req.params.id as string;
    const variants = await productService.getProductVariants(productId);
    sendResponse(res, 200, "Product variants fetched", variants);
  }
);

export const getVariantBySKUHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const sku = req.params.sku as string;
    const result = await productService.getVariantBySKU(sku);

    if (!result) {
      throw new AppError("Variant not found", 404);
    }

    sendResponse(res, 200, "Variant fetched", result);
  }
);

export const updateProductStockHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = req.params.id as string;
    const { variantSKU, stock } = req.body;

    if (typeof stock !== "number" || stock < 0) {
      throw new AppError("Invalid stock value", 400);
    }

    const product = await productService.updateProductStock(productId, stock, variantSKU);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(res, 200, "Stock updated successfully", product);
  }
);
export const setPrimaryImageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId, imageId } = req.body;

    const product = await Product.findById(productId);

    if (!product) throw new AppError("Product not found", 404);

    product.images.forEach((img: any) => {
      img.isPrimary = img._id.toString() === imageId;
    });

    await product.save();

    res.json({ message: "Primary image updated" });
  }
);


export const deleteSingleImageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = asString(req.params.productId as any);
    const imageId = asString(req.params.imageId as any);

    if (!productId || !imageId) {
      throw new AppError("Product ID and Image ID are required", 400);
    }

    const product = await productService.deleteSingleImage(
      productId,
      imageId
    );

    sendResponse(res, 200, "Image deleted successfully", product);
  }
);