import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  refreshTokenHandler,
  logoutHandler,
  getMeHandler,
  getAdminsHandler,
  getCustomersHandler,
  getAdminByIdHandler,
  createAdminHandler,
  updateAdminHandler,
  deleteAdminHandler,
  resendOtpHandler,
  verifyOtpHandler,
  updateProfileHandler,
  changePasswordHandler,
  requestEmailChangeHandler,
  verifyEmailChangeHandler,

} from "./auth.controller";
import { protect, restrictTo } from "../../middlewares/auth";

const router = Router();

// Standard Auth Routes
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/refresh-token", refreshTokenHandler);
router.post("/logout", logoutHandler);
router.get("/me", protect, getMeHandler);
router.post("/verify-otp", verifyOtpHandler);
router.post("/resend-otp", resendOtpHandler);
router.patch("/update-profile", protect, updateProfileHandler);
router.patch("/change-password", protect, changePasswordHandler);
router.post("/request-email-change", protect, requestEmailChangeHandler);
router.post("/verify-email-change", protect, verifyEmailChangeHandler);


// Customer Management (Admin + Superadmin)
router.get("/customers", protect, restrictTo("admin", "superadmin"), getCustomersHandler);

// Admin Management Routes (Superadmin only)
router.get("/admins", protect, restrictTo("superadmin"), getAdminsHandler);
router.post("/admin", protect, restrictTo("superadmin"), createAdminHandler);
router.get("/admin/:id", protect, restrictTo("superadmin"), getAdminByIdHandler);
router.patch("/admin/:id", protect, restrictTo("superadmin"), updateAdminHandler);
router.delete("/admin/:id", protect, restrictTo("superadmin"), deleteAdminHandler);

export default router;
