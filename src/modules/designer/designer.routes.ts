import express from "express";

import {
  createDesigner,
  getAdminDesignerById,
  getAdminDesigners,
  deleteDesigner,
  getFavoriteDesigners,
  getAllDesigners,
  getDesignerById,
  getDesignerBySlug,
  updateDesigner,
} from "./designer.controller";
import { validate } from "../../middlewares/validate";
import { protect, restrictTo } from "../../middlewares/auth";
import {
  createDesignerSchema,
  updateDesignerSchema,
} from "./designer.schema";

const router = express.Router();

router.get("/favorites", getFavoriteDesigners);
router.get(
  "/admin",
  protect,
  restrictTo("admin", "superadmin"),
  getAdminDesigners
);
router.get(
  "/admin/:id",
  protect,
  restrictTo("admin", "superadmin"),
  getAdminDesignerById
);
router.get("/slug/:slug", getDesignerBySlug);
router.get("/", getAllDesigners);
router.get("/:id", getDesignerById);

router.post(
  "/",
  protect,
  restrictTo("admin", "superadmin"),
  validate(createDesignerSchema),
  createDesigner
);
router.put(
  "/:id",
  protect,
  restrictTo("admin", "superadmin"),
  validate(updateDesignerSchema),
  updateDesigner
);
router.delete(
  "/:id",
  protect,
  restrictTo("admin", "superadmin"),
  deleteDesigner
);

export default router;
