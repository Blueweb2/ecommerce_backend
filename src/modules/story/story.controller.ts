// src/modules/story/story.controller.ts

import { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../utils/AppError";
import {
  createStoryService,
  getFeaturedStoryByCategory,
  getStoriesByCategoryService,
  getStoriesService,
  deleteStoryService,
  getStoryBySlugService,
  updateStoryService,
  getRelatedStoriesService,
} from "./story.service";
import {
  storyCategorySchema,
  updateStorySchema,
} from "./story.validation";
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

    return res.json({
      success: true,
      data: story,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message || "Story not found",
    });
  }
};

export const getStoryById = async (req: Request, res: Response) => {
  try {
    const id = getParamValue(req.params.id);

    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    const story = await Story.findById(id).populate("sections.products");

    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    return res.json({ success: true, data: story });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch story",
    });
  }
};

export const createStory = async (req: Request, res: Response) => {
  try {
    const story = await createStoryService(req.body);

    return res.status(201).json({
      success: true,
      data: story,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create story",
    });
  }
};

export const getStories = async (_req: Request, res: Response) => {
  try {
    const stories = await getStoriesService({ isActive: true });

    return res.json({
      success: true,
      data: stories,
    });
  } catch (_error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stories",
    });
  }
};

export const getStoriesByCategory = async (req: Request, res: Response) => {
  try {
    const category = getParamValue(req.params.category);
    const parsedCategory = storyCategorySchema.safeParse(category);

    if (!parsedCategory.success) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: parsedCategory.error.issues.map((issue) => ({
          field: issue.path.map(String).join(".") || "category",
          message: issue.message,
        })),
      });
    }

    const stories = await getStoriesByCategoryService(parsedCategory.data);

    return res.json({
      success: true,
      data: stories,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch stories by category",
    });
  }
};

export const getFeaturedStoryForCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const category = getParamValue(req.params.category);
    const parsedCategory = storyCategorySchema.safeParse(category);

    if (!parsedCategory.success) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: parsedCategory.error.issues.map((issue) => ({
          field: issue.path.map(String).join(".") || "category",
          message: issue.message,
        })),
      });
    }

    const story = await getFeaturedStoryByCategory(parsedCategory.data);

    return res.json({
      success: true,
      data: story,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch featured story",
    });
  }
};

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

    return res.json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message || "Delete failed",
    });
  }
};

export const updateStory = async (req: Request, res: Response) => {
  try {
    const id = getParamValue(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Story id is required",
      });
    }

    const validatedData = updateStorySchema.parse(req.body);

    if (!req.file && Object.keys(validatedData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update the story",
      });
    }

    const updatedStory = await updateStoryService(id, validatedData, req.file);

    return res.status(200).json({
      success: true,
      message: "Story updated successfully",
      data: updatedStory,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.issues.map((issue) => ({
          field: issue.path.map(String).join(".") || "root",
          message: issue.message,
        })),
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update story",
    });
  }
};

export const getRelatedStories = async (req: Request, res: Response) => {
  try {
    const slug = getParamValue(req.params.slug);
    const category = getParamValue(req.query.category as string | undefined);
    const rawLimit = getParamValue(req.query.limit as string | undefined);
    const limit = rawLimit ? parseInt(rawLimit, 10) : 3;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const parsedCategory = storyCategorySchema.safeParse(category);

    if (!parsedCategory.success) {
      return res.status(400).json({
        success: false,
        message: "A valid category is required",
      });
    }

    const stories = await getRelatedStoriesService(
      slug,
      parsedCategory.data,
      isNaN(limit) ? 3 : Math.min(limit, 10)
    );

    return res.json({
      success: true,
      data: stories,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch related stories",
    });
  }
};
