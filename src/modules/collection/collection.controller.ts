import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/response";
import * as collectionService from "./collection.service";
import { createCollectionSchema } from "./collection.schema";

const getParam = (param: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

const normalizeCollectionPayload = (raw: Record<string, any>) => ({
  title: raw.title,
  description: raw.description,
  category: raw.category,
  image: raw.image ?? raw.bannerImage,
  cta: raw.cta,
  priority: raw.priority,
  isActive: raw.isActive,
});

export const getCollectionsByCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = getParam(req.params.categoryId);

    const collections = await collectionService.getCollectionsByCategory(categoryId);

    sendResponse(res, 200, "Collections fetched", collections);
  }
);

export const createCollectionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const normalizedBody = normalizeCollectionPayload(
      req.body as Record<string, any>
    );
    const validatedData = createCollectionSchema.parse(normalizedBody);

    const collection = await collectionService.createCollection(validatedData);

    sendResponse(res, 201, "Collection created successfully", collection);
  }
);

export const getCollectionsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const collections = await collectionService.getActiveCollections();

    sendResponse(res, 200, "Collections fetched successfully", collections);
  }
);

export const getCollectionBySlugHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const slug = getParam(req.params.slug);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const sort =
      typeof req.query.sort === "string" ? req.query.sort : "createdAt-desc";

    const result = await collectionService.getCollectionProductsBySlug(slug, {
      page,
      limit,
      sort,
    });

    sendResponse(res, 200, "Collection fetched successfully", result);
  }
);

export const getCollectionByIdHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParam(req.params.id);
    const collection = await collectionService.getCollectionById(id);

    sendResponse(res, 200, "Collection fetched successfully", collection);
  }
);

export const updateCollectionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParam(req.params.id);
    const normalizedBody = normalizeCollectionPayload(
      req.body as Record<string, any>
    );
    const validatedData = createCollectionSchema.partial().parse(normalizedBody);
    const collection = await collectionService.updateCollection(id, validatedData);

    sendResponse(res, 200, "Collection updated successfully", collection);
  }
);

export const deleteCollectionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParam(req.params.id);
    await collectionService.deleteCollection(id);

    sendResponse(res, 200, "Collection deleted successfully");
  }
);
