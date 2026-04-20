import { Router } from "express";
import * as bannerController from "./banner.controller";

const router = Router();

// ==========================
// 🔓 Public Routes
// ==========================

// Get all banners (for homepage)
router.get("/", bannerController.getBanners);

// Get single banner
router.get("/:id", bannerController.getBannerById);

// ==========================
// 🔒 Admin Routes (Protect later with middleware)
// ==========================

// Create banner
router.post("/", bannerController.createBanner);

// Update banner
router.patch("/:id", bannerController.updateBanner);

// Delete banner
router.delete("/:id", bannerController.deleteBanner);

export default router;