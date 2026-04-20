// src/modules/story/story.service.ts

import { Story } from "./story.model";
import cloudinary from "../../config/cloudinary";

import slugify from "slugify";

// 🔥 CREATE STORY
export const createStoryService = async (data: any) => {
  const story = await Story.create(data);
  return story;
};

// 🔥 GET STORY BY SLUG
export const getStoryBySlugService = async (slug: string) => {
  const story = await Story.findOne({ slug, isActive: true });

  if (!story) {
    throw new Error("Story not found");
  }

  return story;
};


// 🔥 GET ALL STORIES
export const getStoriesService = async () => {
  const stories = await Story.find({ isActive: true })
    .sort({ createdAt: -1 });

  return stories;
};

// 🔥 DELETE STORY
export const deleteStoryService = async (id: string) => {
  const story = await Story.findById(id);

  if (!story) {
    throw new Error("Story not found");
  }

  // ✅ Delete image from Cloudinary
  if (story.image?.public_id) {
    await cloudinary.uploader.destroy(story.image.public_id);
  }

  await story.deleteOne();

  return true;
};