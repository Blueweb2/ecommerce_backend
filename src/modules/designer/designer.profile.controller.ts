import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/AppError";
import { updateDesignerProfileService } from "./designer.service";
import { Designer } from "./designer.model";
import { sendResponse } from "../../utils/response";

// ─── GET /designers/auth/profile — Get own profile ─────────────────────────

export const getDesignerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = (req as any).designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    const designer = await Designer.findById(designerId).populate(
      "categories",
      "name slug"
    );

    if (!designer) return next(new AppError("Designer not found", 404));

    res.status(200).json({
      success: true,
      data: { designer },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /designers/auth/profile — Update own profile ─────────────────────

export const updateDesignerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = (req as any).designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    // Explicitly strip storefront/admin-only fields from request body
    const {
      isActive,
      isFavorite,
      isFeatured,
      isVerified,
      verificationStatus,
      password,
      email,
      role,
      slug,
      ...safePayload
    } = req.body;

    const designer = await updateDesignerProfileService(designerId, safePayload);

    sendResponse(res, 200, "Profile updated successfully", { designer });
  } catch (error) {
    next(error);
  }
};
