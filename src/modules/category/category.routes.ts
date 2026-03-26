import { Router } from "express";
import {
  createCategoryHandler,
  getCategoriesHandler,
  getCategoryHandler,
  getCategoryBySlugHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from "./category.controller";

import { validate } from "../../middlewares/validate";
import { protect, restrictTo } from "../../middlewares/auth";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./category.schema";

const router = Router();

// Public routes
router.get("/", getCategoriesHandler);
router.get("/slug/:slug", getCategoryBySlugHandler);
router.get("/:id", getCategoryHandler);

// Admin only routes
router.post("/", protect, restrictTo("admin", "superadmin"), validate(createCategorySchema), createCategoryHandler);
router.put("/:id", protect, restrictTo("admin", "superadmin"), validate(updateCategorySchema), updateCategoryHandler);
router.delete("/:id", protect, restrictTo("admin", "superadmin"), deleteCategoryHandler);

export default router;
