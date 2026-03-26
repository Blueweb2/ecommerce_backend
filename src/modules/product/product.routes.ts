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
  getVariantBySKUHandler,
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

// Public routes (must come BEFORE /:id route)
router.get("/featured", getFeaturedProductsHandler);
router.get("/search", searchProductsHandler);
router.get("/slug/:slug", getProductBySlugHandler);
router.get("/variant/:sku", getVariantBySKUHandler);
router.get("/:id/variants", getProductVariantsHandler);
router.get("/", getProductsHandler);
router.get("/:id", getProductHandler);

// Protected routes (admin only)
router.post("/", protect, restrictTo("admin", "superadmin"), validate(createProductSchema), createProductHandler);
router.put("/:id", protect, restrictTo("admin", "superadmin"), validate(updateProductSchema), updateProductHandler);
router.put("/:id/stock", protect, restrictTo("admin", "superadmin"), updateProductStockHandler);
router.delete("/:id", protect, restrictTo("admin", "superadmin"), deleteProductHandler);


router.post(
  "/",
  protect,
  restrictTo("admin", "superadmin"),
  upload.array("images", 5), // max 5 images
  validate(createProductSchema),
  createProductHandler
);

router.delete(
  "/:productId/image/:imageId",
  protect,
  restrictTo("admin"),
  deleteSingleImageHandler
);

export default router;
