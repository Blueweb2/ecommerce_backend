import { Router } from "express";

import {
  createCollectionHandler,
  getCollectionBySlugHandler,
  getCollectionsHandler,
} from "./collection.controller";
import { protect, restrictTo } from "../../middlewares/auth";

const router = Router();

router.post("/", protect, restrictTo("admin", "superadmin"), createCollectionHandler);
router.get("/", getCollectionsHandler);
router.get("/:slug", getCollectionBySlugHandler);

export default router;
