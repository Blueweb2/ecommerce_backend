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
import { protectDesigner } from "../../middlewares/auth";
import {
  createDesignerSchema,
  updateDesignerSchema,
} from "./designer.schema";
import {
  loginDesigner,
  logoutDesigner,
  getMe,
  changePassword,
} from "./designer.auth.controller";
import { getDashboardStats } from "./designer.dashboard.controller";
import {
  getDesignerProducts,
  getDesignerProductById,
  createDesignerProduct,
  updateDesignerProduct,
  deleteDesignerProduct,
} from "./designer.product.controller";
import { getDesignerOrders, getDesignerOrderById } from "./designer.order.controller";
import {
  getDesignerCoupons,
  createDesignerCoupon,
  updateDesignerCoupon,
  deleteDesignerCoupon,
} from "./designer.coupon.controller";
import { getDesignerAnalytics } from "./designer.analytics.controller";

const router = express.Router();

// Auth routes
router.post("/auth/login", loginDesigner);
router.post("/auth/logout", logoutDesigner);
router.get("/auth/me", protectDesigner, getMe);
router.post("/auth/change-password", protectDesigner, changePassword);

// Dashboard routes
router.get("/dashboard/stats", protectDesigner, getDashboardStats);

// Product routes
router.get("/products", protectDesigner, getDesignerProducts);
router.get("/products/:id", protectDesigner, getDesignerProductById);
router.post("/products", protectDesigner, createDesignerProduct);
router.put("/products/:id", protectDesigner, updateDesignerProduct);
router.delete("/products/:id", protectDesigner, deleteDesignerProduct);

// Order routes
router.get("/orders", protectDesigner, getDesignerOrders);
router.get("/orders/:id", protectDesigner, getDesignerOrderById);

// Coupon routes
router.get("/coupons", protectDesigner, getDesignerCoupons);
router.post("/coupons", protectDesigner, createDesignerCoupon);
router.put("/coupons/:id", protectDesigner, updateDesignerCoupon);
router.delete("/coupons/:id", protectDesigner, deleteDesignerCoupon);

// Analytics routes
router.get("/analytics", protectDesigner, getDesignerAnalytics);

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
