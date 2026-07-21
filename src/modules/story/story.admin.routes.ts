import express from "express";
import { protect, restrictTo } from "../../middlewares/auth";
import {
  createStory,
  getStories,
  deleteStory,
  updateStory,
  getStoryById,
} from "./story.controller";

const router = express.Router();

const adminOnly = [protect, restrictTo("admin", "superadmin")];

router.get("/", ...adminOnly, getStories);
router.get("/:id", ...adminOnly, getStoryById);
router.post("/", ...adminOnly, createStory);
router.put("/:id", ...adminOnly, updateStory);
router.delete("/:id", ...adminOnly, deleteStory);

export default router;
