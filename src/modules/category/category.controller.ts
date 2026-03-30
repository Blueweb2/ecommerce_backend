import { Request, Response } from "express";
import * as categoryService from "./category.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/response";

export const createCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body);
    sendResponse(res, 201, "Category created successfully", category);
  }
);

export const getCategoryTreeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const tree = await categoryService.getCategoryTree();
    sendResponse(res, 200, "Category tree fetched", tree);
  }
);

export const getCategoriesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await categoryService.getAllCategories();
    sendResponse(res, 200, "Categories fetched successfully", categories);
  }
);

export const getCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = req.params.id as string;
    const category = await categoryService.getCategoryById(categoryId);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    sendResponse(res, 200, "Category fetched successfully", category);
  }
);

export const getCategoryBySlugHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const category = await categoryService.getCategoryBySlug(slug);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    sendResponse(res, 200, "Category fetched successfully", category);
  }
);

export const updateCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = req.params.id as string;
    const category = await categoryService.updateCategory(
      categoryId,
      req.body
    );

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    sendResponse(res, 200, "Category updated successfully", category);
  }
);

export const deleteCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = req.params.id as string;
    const category = await categoryService.deleteCategory(categoryId);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    sendResponse(res, 200, "Category deleted successfully");
  }
);
