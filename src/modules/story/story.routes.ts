// src/modules/story/story.routes.ts

import express from "express";
import {
  createStory,
  getStories,
  deleteStory,
  getStoryBySlug,
} from "./story.controller";
import { protect, restrictTo } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { createStorySchema } from "./story.validation";

const router = express.Router();

// ✅ PUBLIC: Get all stories
router.get("/", getStories);
router.get("/slug/:slug", getStoryBySlug);
// 🔐 PROTECTED: Admin only
router.post(
  "/",
  protect,
  restrictTo("admin", "superadmin"),
  validate(createStorySchema),
  createStory
);

router.delete(
  "/:id",
  protect,
  restrictTo("admin", "superadmin"),
  deleteStory
);

export default router;