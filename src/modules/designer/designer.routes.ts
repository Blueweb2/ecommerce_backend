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
  updateDesignerStorefront,
  approveDesigner,
  rejectDesigner,
  adminResetPassword,
} from "./designer.controller";

import { validate } from "../../middlewares/validate";
import { protect, restrictTo, protectDesigner } from "../../middlewares/auth";

import {
  adminCreateDesignerSchema,
  updateDesignerSchema,
  adminStorefrontSchema,
} from "./designer.schema";

import {
  loginDesigner,
  logoutDesigner,
  getMe,
  changePassword,
  refreshDesignerToken,
} from "./designer.auth.controller";

import {
  getDesignerProfile,
  updateDesignerProfile,
} from "./designer.profile.controller";

import { getDashboardStats } from "./designer.dashboard.controller";

import {
  getDesignerProducts,
  getDesignerProductById,
  createDesignerProduct,
  updateDesignerProduct,
  deleteDesignerProduct,
} from "./designer.product.controller";

import {
  getDesignerOrders,
  getDesignerOrderById,
} from "./designer.order.controller";

import {
  getDesignerCoupons,
  createDesignerCoupon,
  updateDesignerCoupon,
  deleteDesignerCoupon,
} from "./designer.coupon.controller";

import { getDesignerAnalytics } from "./designer.analytics.controller";

import { getSignature as getCloudinarySignature } from "../cloudinary/cloudinary.controller";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Designer Auth routes
// ─────────────────────────────────────────────────────────────────────────────

router.post("/auth/login", loginDesigner);
router.post("/auth/refresh-token", refreshDesignerToken); // ← designer-isolated refresh
router.post("/auth/logout", logoutDesigner);
router.get("/auth/me", protectDesigner, getMe);
router.post("/auth/change-password", protectDesigner, changePassword);

// ─────────────────────────────────────────────────────────────────────────────
// Designer Self-Service Profile
// ─────────────────────────────────────────────────────────────────────────────

router.get("/auth/profile", protectDesigner, getDesignerProfile);
router.put("/auth/profile", protectDesigner, updateDesignerProfile);

// ─────────────────────────────────────────────────────────────────────────────
// Designer Dashboard
// ─────────────────────────────────────────────────────────────────────────────

router.get("/dashboard/stats", protectDesigner, getDashboardStats);

// ─────────────────────────────────────────────────────────────────────────────
// Designer Product routes (ownership enforced in controller)
// ─────────────────────────────────────────────────────────────────────────────

router.get("/products", protectDesigner, getDesignerProducts);
router.get("/products/:id", protectDesigner, getDesignerProductById);
router.post("/products", protectDesigner, createDesignerProduct);
router.put("/products/:id", protectDesigner, updateDesignerProduct);
router.delete("/products/:id", protectDesigner, deleteDesignerProduct);

// ─────────────────────────────────────────────────────────────────────────────
// Designer Cloudinary
// ─────────────────────────────────────────────────────────────────────────────

router.get("/cloudinary/signature", protectDesigner, getCloudinarySignature);

// ─────────────────────────────────────────────────────────────────────────────
// Designer Order routes
// ─────────────────────────────────────────────────────────────────────────────

router.get("/orders", protectDesigner, getDesignerOrders);
router.get("/orders/:id", protectDesigner, getDesignerOrderById);

// ─────────────────────────────────────────────────────────────────────────────
// Designer Coupon routes
// ─────────────────────────────────────────────────────────────────────────────

router.get("/coupons", protectDesigner, getDesignerCoupons);
router.post("/coupons", protectDesigner, createDesignerCoupon);
router.put("/coupons/:id", protectDesigner, updateDesignerCoupon);
router.delete("/coupons/:id", protectDesigner, deleteDesignerCoupon);

// ─────────────────────────────────────────────────────────────────────────────
// Designer Analytics
// ─────────────────────────────────────────────────────────────────────────────

router.get("/analytics", protectDesigner, getDesignerAnalytics);



// ─────────────────────────────────────────────────────────────────────────────
// Admin Designer routes
// ─────────────────────────────────────────────────────────────────────────────

const adminGuard = [protect, restrictTo("admin", "superadmin")];

// List & detail
router.get("/admin", ...adminGuard, getAdminDesigners);
router.get("/admin/:id", ...adminGuard, getAdminDesignerById);

// Create (name + email + password only)
router.post(
  "/",
  ...adminGuard,
  validate(adminCreateDesignerSchema),
  createDesigner
);

// Full update (admin)
router.put(
  "/:id",
  ...adminGuard,
  validate(updateDesignerSchema),
  updateDesigner
);

// Storefront controls (isFeatured, isFavorite, isActive)
router.put(
  "/admin/:id/storefront",
  ...adminGuard,
  validate(adminStorefrontSchema),
  updateDesignerStorefront
);



// Approval workflow
router.put("/admin/:id/approve", ...adminGuard, approveDesigner);
router.put("/admin/:id/reject", ...adminGuard, rejectDesigner);

// Password reset
router.post("/admin/:id/reset-password", ...adminGuard, adminResetPassword);

// Delete
router.delete("/:id", ...adminGuard, deleteDesigner);

// ─────────────────────────────────────────────────────────────────────────────
// Public designer routes
// ─────────────────────────────────────────────────────────────────────────────

router.get("/favorites", getFavoriteDesigners);
router.get("/slug/:slug", getDesignerBySlug);
router.get("/", getAllDesigners);
router.get("/:id", getDesignerById);

export default router;
