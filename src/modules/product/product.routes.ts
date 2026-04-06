import { Router } from "express";
import {
  createProductHandler,
  getProductsHandler,
  getProductHandler,
  getProductBySlugHandler,
  updateProductHandler,
  deleteProductHandler,
  searchProductsHandler,
  getFeaturedProductsHandler,
  getProductVariantsHandler,
  updateProductStockHandler,
  deleteSingleImageHandler,
} from "./product.controller";

import { upload } from "../../middlewares/upload";
import { validate } from "../../middlewares/validate";
import { protect, restrictTo } from "../../middlewares/auth";

import {
  createProductSchema,
  updateProductSchema,
} from "./product.schema";

const router = Router();


// ======================================================
// ✅ PUBLIC ROUTES
// ======================================================

// Order matters (specific → general)
router.get("/featured", getFeaturedProductsHandler);
router.get("/search", searchProductsHandler);
router.get("/slug/:slug", getProductBySlugHandler);
router.get("/:id/variants", getProductVariantsHandler);
router.get("/", getProductsHandler);
router.get("/:id", getProductHandler);


// ======================================================
// 🔐 ADMIN ROUTES
// ======================================================

router.post(
  "/",
  protect,
  restrictTo("admin", "superadmin"),
  upload.array("images", 5),
  createProductHandler
);

router.put(
  "/:id",
  protect,
  restrictTo("admin", "superadmin"),
  validate(updateProductSchema),
  updateProductHandler
);

router.put(
  "/:id/stock",
  protect,
  restrictTo("admin", "superadmin"),
  updateProductStockHandler
);

router.delete(
  "/:id",
  protect,
  restrictTo("admin", "superadmin"),
  deleteProductHandler
);


// ======================================================
// 🖼 IMAGE MANAGEMENT
// ======================================================

router.delete(
  "/:productId/image/:imageId",
  protect,
  restrictTo("admin", "superadmin"),
  deleteSingleImageHandler
);


export default router;