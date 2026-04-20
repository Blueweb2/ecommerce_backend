// src/modules/story/story.controller.ts

import { Request, Response } from "express";
import {
  createStoryService,
  getStoriesService,
  deleteStoryService,
  getStoryBySlugService,
} from "./story.service";
import { Story } from "./story.model";

const getParamValue = (
  param: string | string[] | undefined
): string | undefined => {
  if (Array.isArray(param)) return param[0];
  return param;
};

export const getStoryBySlug = async (req: Request, res: Response) => {
  try {
    const slug = getParamValue(req.params.slug);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const story = await getStoryBySlugService(slug);

    res.json({
      success: true,
      data: story,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || "Story not found",
    });
  }
};;

// 🔥 CREATE
export const createStory = async (req: Request, res: Response) => {
  try {
    const story = await createStoryService(req.body);

    res.status(201).json({
      success: true,
      data: story,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create story",
    });
  }
};

// 🔥 GET ALL
export const getStories = async (_req: Request, res: Response) => {
  try {
    const stories = await getStoriesService();

    res.json({
      success: true,
      data: stories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch stories",
    });
  }
};

// 🔥 DELETE
export const deleteStory = async (req: Request, res: Response) => {
  try {
    const id = getParamValue(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Story id is required",
      });
    }

    await deleteStoryService(id);

    res.json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || "Delete failed",
    });
  }
};
