import { Router } from "express";

import {
  createCollectionHandler,
  deleteCollectionHandler,
  getCollectionBySlugHandler,
  getCollectionsHandler,
  updateCollectionHandler,
  getCollectionByIdHandler,
  getCollectionsByCategoryHandler,
} from "./collection.controller";
import { protect, restrictTo } from "../../middlewares/auth";

const router = Router();

router.post(
  "/",
  protect,
  restrictTo("admin", "superadmin"),
  createCollectionHandler
);

router.get("/category/:categoryId", getCollectionsByCategoryHandler);
router.get("/", getCollectionsHandler);
router.get(
  "/admin/:id",
  protect,
  restrictTo("admin", "superadmin"),
  getCollectionByIdHandler
);
router.get("/:slug", getCollectionBySlugHandler);
router.put("/:id", protect, restrictTo("admin", "superadmin"), updateCollectionHandler);
router.delete(
  "/:id",
  protect,
  restrictTo("admin", "superadmin"),
  deleteCollectionHandler
);

export default router;
