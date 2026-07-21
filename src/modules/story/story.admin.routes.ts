import express from "express";
import { protect, restrictTo } from "../../middlewares/auth";
import {
  createStory,
  getStories,
  deleteStory,
  updateStory,
  getStoryById,
} from "./story.controller";
import { validate } from "../../middlewares/validate";
import { createStorySchema } from "./story.validation";

const router = express.Router();

const adminOnly = [protect, restrictTo("admin", "superadmin")];

router.get("/", ...adminOnly, getStories);
router.get("/:id", ...adminOnly, getStoryById);
router.post("/", ...adminOnly, validate(createStorySchema), createStory);
router.put("/:id", ...adminOnly, updateStory);
router.delete("/:id", ...adminOnly, deleteStory);

export default router;
