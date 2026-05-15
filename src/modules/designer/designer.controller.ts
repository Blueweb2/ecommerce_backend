import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/response";
import {
  createDesignerService,
  getAdminDesignersService,
  deleteDesignerService,
  getFavoriteDesignersService,
  getAllDesignersService,
  getDesignerByIdService,
  updateDesignerService,
  getDesignerBySlugService,
} from "./designer.service";

export const getDesignerBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const slug = getParam(req.params.slug);

    const designer = await getDesignerBySlugService(slug, {
      isActive: true,
    });

    if (!designer) {
      throw new AppError("Designer not found", 404);
    }

    sendResponse(res, 200, "Designer fetched successfully", {
      designer,
    });
  }
);

const getQueryString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
};

const getParam = (param: string | string[]): string =>
  Array.isArray(param) ? param[0] : param;

const getOptionalBoolean = (value: unknown): boolean | undefined => {
  const queryValue = getQueryString(value);

  if (typeof queryValue === "undefined") {
    return undefined;
  }

  if (queryValue === "true") {
    return true;
  }

  if (queryValue === "false") {
    return false;
  }

  throw new AppError(`Invalid boolean query value: ${queryValue}`, 400);
};

export const createDesigner = asyncHandler(
  async (req: Request, res: Response) => {
    const designer = await createDesignerService(req.body);

    sendResponse(res, 201, "Designer created successfully", { designer });
  }
);

export const getAllDesigners = asyncHandler(
  async (req: Request, res: Response) => {
    const search = getQueryString(req.query.search);
    const isFavorite = getOptionalBoolean(req.query.isFavorite);
    const designers = await getAllDesignersService({
      isFavorite,
      isActive: true,
      search,
    });

    sendResponse(res, 200, "Designers fetched successfully", { designers });
  }
);

export const getFavoriteDesigners = asyncHandler(
  async (_req: Request, res: Response) => {
    const designers = await getFavoriteDesignersService();

    sendResponse(res, 200, "Favorite designers fetched successfully", {
      designers,
    });
  }
);

export const getDesignerById = asyncHandler(
  async (req: Request, res: Response) => {
    const designer = await getDesignerByIdService(getParam(req.params.id), {
      isActive: true,
    });

    if (!designer) {
      throw new AppError("Designer not found", 404);
    }

    sendResponse(res, 200, "Designer fetched successfully", { designer });
  }
);

export const getAdminDesigners = asyncHandler(
  async (req: Request, res: Response) => {
    const search = getQueryString(req.query.search);
    const isFavorite = getOptionalBoolean(req.query.isFavorite);
    const isActive = getOptionalBoolean(req.query.isActive);
    const designers = await getAdminDesignersService({
      isFavorite,
      isActive,
      search,
    });

    sendResponse(res, 200, "Admin designers fetched successfully", {
      designers,
    });
  }
);

export const getAdminDesignerById = asyncHandler(
  async (req: Request, res: Response) => {
    const designer = await getDesignerByIdService(getParam(req.params.id));

    if (!designer) {
      throw new AppError("Designer not found", 404);
    }

    sendResponse(res, 200, "Designer fetched successfully", { designer });
  }
);

export const updateDesigner = asyncHandler(
  async (req: Request, res: Response) => {
    const designer = await updateDesignerService(getParam(req.params.id), req.body);

    sendResponse(res, 200, "Designer updated successfully", { designer });
  }
);

export const deleteDesigner = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteDesignerService(getParam(req.params.id));

    sendResponse(res, 200, "Designer deleted successfully");
  }
);
