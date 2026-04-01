import { Request, Response } from "express";
import * as productService from "./product.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/response";
import { Product } from "./product.model";

// ======================================================
// ✅ HELPERS (FIXED)
// ======================================================

// safer query parser
const asString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
};

// safer param parser
const getParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

// ======================================================
// ✅ CREATE PRODUCT
// ======================================================

export const createProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await productService.createProduct(req.body);
    sendResponse(res, 201, "Product created successfully", product);
  }
);

// ======================================================
// ✅ GET ALL PRODUCTS
// ======================================================

export const getProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const filters: any = {};

    const category = asString(req.query.category);
    if (category) filters.category = category;

    const sections = asString(req.query.sections);
    if (sections) {
      filters.sections = sections.split(",").map((s) => s.trim());
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

    sendResponse(res, 200, "Products fetched successfully", result);
  }
);

// ======================================================
// ✅ GET PRODUCT BY ID
// ======================================================

export const getProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParam(req.params.id);

    const product = await productService.getProductById(id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(res, 200, "Product fetched successfully", product);
  }
);

// ======================================================
// ✅ GET PRODUCT BY SLUG
// ======================================================

export const getProductBySlugHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const slug = getParam(req.params.slug);

    const product = await productService.getProductBySlug(slug);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(res, 200, "Product fetched successfully", product);
  }
);

// ======================================================
// ✅ UPDATE PRODUCT
// ======================================================

export const updateProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParam(req.params.id);

    const product = await productService.updateProduct(id, req.body);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    sendResponse(res, 200, "Product updated successfully", product);
  }
);

// ======================================================
// ✅ DELETE PRODUCT
// ======================================================

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

// ======================================================
// ✅ SEARCH PRODUCTS
// ======================================================

export const searchProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = asString(req.query.q);

    if (!query || query.trim() === "") {
      throw new AppError("Search query is required", 400);
    }

    const products = await productService.searchProducts(query);

    sendResponse(res, 200, "Search results", products);
  }
);

// ======================================================
// ✅ FEATURED PRODUCTS
// ======================================================

export const getFeaturedProductsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const products = await productService.getFeaturedProducts();

    sendResponse(res, 200, "Featured products fetched", products);
  }
);

// ======================================================
// ✅ VARIANTS
// ======================================================

export const getProductVariantsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParam(req.params.id);

    const variants = await productService.getProductVariants(id);

    sendResponse(res, 200, "Product variants fetched", variants);
  }
);

// ======================================================
// ✅ UPDATE STOCK
// ======================================================

export const updateProductStockHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParam(req.params.id);

    const { variantSKU, stock } = req.body;

    if (typeof stock !== "number" || stock < 0) {
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

    sendResponse(res, 200, "Stock updated successfully", product);
  }
);

// ======================================================
// ✅ SET PRIMARY IMAGE
// ======================================================

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

// ======================================================
// ✅ DELETE SINGLE IMAGE
// ======================================================

export const deleteSingleImageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = getParam(req.params.productId);
    const imageId = getParam(req.params.imageId);

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