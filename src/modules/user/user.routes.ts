import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  getMeHandler,
  updateProfileHandler,
  createAdminHandler,
  createSuperAdminHandler,
getAdminsHandler,
getCustomersHandler,
updateAdminHandler,
getAdminByIdHandler,
deleteAdminHandler
} from "./user.controller";

import { validate } from "../../middlewares/validate";
import { registerSchema, loginSchema, updateUserSchema, createSuperAdminSchema } from "./user.schema";
import { protect, restrictTo } from "../../middlewares/auth";

const router = Router();

// Auth routes (public)
router.post("/register", validate(registerSchema), registerHandler);
router.post("/login", validate(loginSchema), loginHandler);

// Superadmin creation (requires master key)
router.post("/superadmin", validate(createSuperAdminSchema), createSuperAdminHandler);

// Protected routes
router.get("/me", protect, getMeHandler);
router.put("/profile", protect, validate(updateUserSchema), updateProfileHandler);
// Customers (admin + superadmin)
router.get(
  "/customers",
  protect,
  restrictTo("admin", "superadmin"),
  getCustomersHandler
);

// Admins (superadmin only)
router.get(
  "/admins",
  protect,
  restrictTo("superadmin"),
  getAdminsHandler
);

// 🔍 Get single admin
router.get(
  "/admin/:id",
  protect,
  restrictTo("superadmin"),
  getAdminByIdHandler
);

// ✏️ Update admin
router.patch(
  "/admin/:id",
  protect,
  restrictTo("superadmin"),
  updateAdminHandler
);

// 🗑️ Delete admin
router.delete(
  "/admin/:id",
  protect,
  restrictTo("superadmin"),
  deleteAdminHandler
);
// Admin routes
router.post("/admin", protect, restrictTo("superadmin"), validate(registerSchema), createAdminHandler);

export default router;
