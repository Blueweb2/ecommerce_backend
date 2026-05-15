import mongoose from "mongoose";

import { AppError } from "../../utils/AppError";
import { Designer } from "./designer.model";
import { IDesigner } from "./designer.types";
import { buildUniqueDesignerSlug, escapeRegex } from "./designer.utils";

type DesignerPayload = {
  name?: string;
  description?: string;
  brandName?: string;
  avatar?: IDesigner["avatar"];
  brandImage?: IDesigner["brandImage"];
  bannerImage?: IDesigner["bannerImage"];
  isFavorite?: boolean;
  isActive?: boolean;
};

type DesignerListOptions = {
  isFavorite?: boolean;
  isActive?: boolean;
  search?: string;
};

const ensureValidDesignerId = (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid designer ID", 400);
  }
};

const buildSearchQuery = (search?: string) => {
  const trimmedSearch = search?.trim();

  if (!trimmedSearch) {
    return {};
  }

  const regex = new RegExp(escapeRegex(trimmedSearch), "i");

  return {
    $or: [
      { name: regex },
      { brandName: regex },
      { description: regex },
      { slug: regex },
    ],
  };
};

export const createDesignerService = async (payload: DesignerPayload) => {
  if (!payload.name) {
    throw new AppError("Name is required", 400);
  }

  if (!payload.description) {
    throw new AppError("Description is required", 400);
  }

  if (!payload.brandName) {
    throw new AppError("Brand name is required", 400);
  }

  const slug = await buildUniqueDesignerSlug(payload.name);

  try {
    return await Designer.create({
      ...payload,
      slug,
    });
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.slug) {
      throw new AppError("Designer slug already exists", 409);
    }

    throw error;
  }
};


export const getDesignerBySlugService = async (
  slug: string,
  filters: Record<string, unknown> = {}
) => {
  return Designer.findOne({
    slug,
    ...filters,
  });
};


export const getAllDesignersService = async (
  options: DesignerListOptions = {}
) => {
  const query: Record<string, unknown> = {
    isActive: true,
    ...buildSearchQuery(options.search),
  };

  if (typeof options.isFavorite === "boolean") {
    query.isFavorite = options.isFavorite;
  }

  if (typeof options.isActive === "boolean") {
    query.isActive = options.isActive;
  }

  return Designer.find(query).sort({ createdAt: -1 });
};

export const getFavoriteDesignersService = async () => {
  return Designer.find({ isFavorite: true, isActive: true }).sort({
    createdAt: -1,
  });
};

export const getDesignerByIdService = async (
  id: string,
  options?: { isActive?: boolean }
) => {
  ensureValidDesignerId(id);

  const query: Record<string, unknown> = { _id: id };

  if (typeof options?.isActive === "boolean") {
    query.isActive = options.isActive;
  }

  return Designer.findOne(query);
};

export const getAdminDesignersService = async (
  options: DesignerListOptions = {}
) => {
  const query: Record<string, unknown> = buildSearchQuery(options.search);

  if (typeof options.isFavorite === "boolean") {
    query.isFavorite = options.isFavorite;
  }

  if (typeof options.isActive === "boolean") {
    query.isActive = options.isActive;
  }

  return Designer.find(query).sort({ createdAt: -1 });
};

export const updateDesignerService = async (
  id: string,
  payload: DesignerPayload
) => {
  ensureValidDesignerId(id);

  const designer = await Designer.findById(id);

  if (!designer) {
    throw new AppError("Designer not found", 404);
  }

  if (typeof payload.name !== "undefined" && payload.name !== designer.name) {
    designer.name = payload.name;
    designer.slug = await buildUniqueDesignerSlug(payload.name, id);
  }

  if (typeof payload.description !== "undefined") {
    designer.description = payload.description;
  }

  if (typeof payload.brandName !== "undefined") {
    designer.brandName = payload.brandName;
  }

  if (typeof payload.avatar !== "undefined") {
    designer.avatar = payload.avatar;
  }

  if (typeof payload.brandImage !== "undefined") {
    designer.brandImage = payload.brandImage;
  }

  if (typeof payload.bannerImage !== "undefined") {
    designer.bannerImage = payload.bannerImage;
  }

  if (typeof payload.isFavorite === "boolean") {
    designer.isFavorite = payload.isFavorite;
  }

  if (typeof payload.isActive === "boolean") {
    designer.isActive = payload.isActive;
  }

  try {
    await designer.save();
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.slug) {
      throw new AppError("Designer slug already exists", 409);
    }

    throw error;
  }

  return designer;
};

export const deleteDesignerService = async (id: string) => {
  ensureValidDesignerId(id);

  const designer = await Designer.findByIdAndDelete(id);

  if (!designer) {
    throw new AppError("Designer not found", 404);
  }

  return designer;
};
