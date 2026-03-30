import { Router } from "express";
import {
  loginHandler,
  refreshTokenHandler,
  logoutHandler,
  getMeHandler,
  getAdminsHandler,
  getAdminByIdHandler,
  createAdminHandler,
  updateAdminHandler,
  deleteAdminHandler,
} from "./auth.controller";
import { protect, restrictTo } from "../../middlewares/auth";

const router = Router();

// Standard Auth Routes
router.post("/login", loginHandler);
router.post("/refresh-token", refreshTokenHandler);
router.post("/logout", logoutHandler);
router.get("/me", protect, getMeHandler);

// Admin Management Routes (Superadmin only)
router.get("/admins", protect, restrictTo("superadmin"), getAdminsHandler);
router.post("/admin", protect, restrictTo("superadmin"), createAdminHandler);
router.get("/admin/:id", protect, restrictTo("superadmin"), getAdminByIdHandler);
router.patch("/admin/:id", protect, restrictTo("superadmin"), updateAdminHandler);
router.delete("/admin/:id", protect, restrictTo("superadmin"), deleteAdminHandler);

export default router;
