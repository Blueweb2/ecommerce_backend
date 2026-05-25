import { Request, Response } from "express";

import cloudinary from "../../config/cloudinary";
import { env } from "../../config/env";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { deleteImageFromCloudinary } from "./cloudinary.service";

const ALLOWED_SIGNATURE_FOLDERS = new Set(["ecommerce/designers", "ecommerce/banners", "ecommerce/products","ecommerce/categories","ecommerce/collections","ecommerce/stories"]);

const getQueryString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
};

export const getSignature = asyncHandler(
  async (req: Request, res: Response) => {
    if (
      !env.CLOUDINARY_CLOUD_NAME ||
      !env.CLOUDINARY_API_KEY ||
      !env.CLOUDINARY_API_SECRET
    ) {
      throw new AppError("Cloudinary is not configured", 500);
    }

    const folder = getQueryString(req.query.folder)?.trim();

    if (!folder) {
      throw new AppError("Folder is required", 400);
    }

    if (!ALLOWED_SIGNATURE_FOLDERS.has(folder)) {
      throw new AppError("Invalid folder", 400);
    }

    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        folder,
        timestamp,
      },
      env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      timestamp,
      signature,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
    });
  }
);

export const deleteImageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { public_id } = req.body;

    if (!public_id) {
      throw new AppError("public_id is required", 400);
    }

    await deleteImageFromCloudinary(public_id);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  }
);
