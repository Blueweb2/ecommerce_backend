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
  updateDesignerStorefrontService,
  approveDesignerService,
  rejectDesignerService,
  adminResetPasswordService,
} from "./designer.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getQueryString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
};

const getParam = (param: string | string[]): string =>
  Array.isArray(param) ? param[0] : param;

const getOptionalBoolean = (value: unknown): boolean | undefined => {
  const queryValue = getQueryString(value);
  if (typeof queryValue === "undefined") return undefined;
  if (queryValue === "true") return true;
  if (queryValue === "false") return false;
  throw new AppError(`Invalid boolean query value: ${queryValue}`, 400);
};

// ─── Public ───────────────────────────────────────────────────────────────────

export const getDesignerBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const slug = getParam(req.params.slug);
    const designer = await getDesignerBySlugService(slug, { isActive: true });

    if (!designer) {
      throw new AppError("Designer not found", 404);
    }

    const { Product } = await import("../product/product.model");
    const products = await Product.find({
      designer: designer._id,
      isPublished: true,
    })
      .populate("category")
      .populate("designer", "name brandName");

    sendResponse(res, 200, "Designer fetched successfully", { designer, products });
  }
);

export const getAllDesigners = asyncHandler(
  async (req: Request, res: Response) => {
    const search = getQueryString(req.query.search);
    const isFavorite = getOptionalBoolean(req.query.isFavorite);
    const designers = await getAllDesignersService({ isFavorite, isActive: true, search });

    sendResponse(res, 200, "Designers fetched successfully", { designers });
  }
);

export const getFavoriteDesigners = asyncHandler(
  async (_req: Request, res: Response) => {
    const designers = await getFavoriteDesignersService();
    sendResponse(res, 200, "Favorite designers fetched successfully", { designers });
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

    const { Product } = await import("../product/product.model");
    const products = await Product.find({ designer: designer._id, isPublished: true }).populate("category").populate("designer");
    console.log(products);

    sendResponse(res, 200, "Designer fetched successfully", { designer, products });
  }
);

// ─── Admin: List & Detail ─────────────────────────────────────────────────────

export const getAdminDesigners = asyncHandler(
  async (req: Request, res: Response) => {
    const search = getQueryString(req.query.search);
    const isFavorite = getOptionalBoolean(req.query.isFavorite);
    const isActive = getOptionalBoolean(req.query.isActive);
    const isVerified = getOptionalBoolean(req.query.isVerified);
    const verificationStatus = getQueryString(req.query.verificationStatus) as
      | "pending"
      | "approved"
      | "rejected"
      | undefined;

    const page = parseInt(getQueryString(req.query.page) || "1", 10);
    const limit = parseInt(getQueryString(req.query.limit) || "20", 10);

    const result = await getAdminDesignersService({
      search,
      isFavorite,
      isActive,
      isVerified,
      verificationStatus,
      page,
      limit,
    });

    sendResponse(res, 200, "Admin designers fetched successfully", result);
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

// ─── Admin: Create ─────────────────────────────────────────────────────────────

export const createDesigner = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const designer = await createDesignerService({ name, email, password });
    sendResponse(res, 201, "Designer account created successfully", { designer });
  }
);

// ─── Admin: Full update ────────────────────────────────────────────────────────

export const updateDesigner = asyncHandler(
  async (req: Request, res: Response) => {
    const designer = await updateDesignerService(getParam(req.params.id), req.body);
    sendResponse(res, 200, "Designer updated successfully", { designer });
  }
);

// ─── Admin: Storefront controls ───────────────────────────────────────────────

export const updateDesignerStorefront = asyncHandler(
  async (req: Request, res: Response) => {
    const { isFeatured, isFavorite, isActive } = req.body;
    const designer = await updateDesignerStorefrontService(
      getParam(req.params.id),
      { isFeatured, isFavorite, isActive }
    );

    sendResponse(res, 200, "Storefront settings updated successfully", { designer });
  }
);

// ─── Admin: Approve ───────────────────────────────────────────────────────────

export const approveDesigner = asyncHandler(
  async (req: Request, res: Response) => {
    const designer = await approveDesignerService(getParam(req.params.id));
    sendResponse(res, 200, "Designer approved successfully", { designer });
  }
);

// ─── Admin: Reject ────────────────────────────────────────────────────────────

export const rejectDesigner = asyncHandler(
  async (req: Request, res: Response) => {
    const { reason } = req.body;
    const designer = await rejectDesignerService(getParam(req.params.id), reason);
    sendResponse(res, 200, "Designer rejected", { designer });
  }
);

// ─── Admin: Reset Password ────────────────────────────────────────────────────

export const adminResetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await adminResetPasswordService(getParam(req.params.id));
    sendResponse(res, 200, result.message);
  }
);

// ─── Admin: Delete ────────────────────────────────────────────────────────────

export const deleteDesigner = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteDesignerService(getParam(req.params.id));
    sendResponse(res, 200, "Designer deleted successfully");
  }
);
