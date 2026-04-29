import { Router } from "express";

import {
  createCollectionHandler,
  deleteCollectionHandler,
  getCollectionBySlugHandler,
  getCollectionsHandler,
  updateCollectionHandler,
  getCollectionByIdHandler,
} from "./collection.controller";
import { protect, restrictTo } from "../../middlewares/auth";

const router = Router();

router.post("/", protect, restrictTo("admin", "superadmin"), createCollectionHandler);
router.get("/", getCollectionsHandler);
router.get("/:slug", getCollectionBySlugHandler);
router.get("/admin/:id", protect, restrictTo("admin", "superadmin"), getCollectionByIdHandler);
router.put("/:id", protect, restrictTo("admin", "superadmin"), updateCollectionHandler);
router.delete("/:id", protect, restrictTo("admin", "superadmin"), deleteCollectionHandler);

export default router;
