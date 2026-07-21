// src/modules/story/story.routes.ts

import express from "express";
import {
  getStories,
  getStoriesByCategory,
  getStoryBySlug,
  getFeaturedStoryForCategory,
  getRelatedStories,
} from "./story.controller";

const router = express.Router();

// PUBLIC: Listings
router.get("/", getStories);
router.get("/category/:category", getStoriesByCategory);
router.get("/featured/:category", getFeaturedStoryForCategory);
router.get("/related/:slug", getRelatedStories);
router.get("/slug/:slug", getStoryBySlug);

export default router;
