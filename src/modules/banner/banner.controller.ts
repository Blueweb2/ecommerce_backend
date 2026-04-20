import { Request, Response } from "express";
import * as bannerService from "./banner.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/response";

// ✅ CREATE Banner
export const createBanner = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.body.image?.url) {
      return sendResponse(res, 400, "Image is required");
    }

    const banner = await bannerService.createBanner(req.body);

    return sendResponse(
      res,
      201,
      "Banner created successfully",
      banner
    );
  }
);

// ✅ GET Banners
export const getBanners = asyncHandler(
  async (_req: Request, res: Response) => {
    const banners = await bannerService.getBanners();

    return sendResponse(
      res,
      200,
      "Banners fetched successfully",
      banners
    );
  }
);

// ✅ DELETE Banner
export const deleteBanner = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    await bannerService.deleteBanner(id);

    return sendResponse(
      res,
      200,
      "Banner deleted successfully"
    );
  }
);

// ✅ UPDATE Banner
export const updateBanner = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const updatedBanner = await bannerService.updateBanner(
      id,
      req.body
    );

    return sendResponse(
      res,
      200,
      "Banner updated successfully",
      updatedBanner
    );
  }
);

// ✅ GET SINGLE Banner
export const getBannerById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const banner = await bannerService.getBannerById(id);

    return sendResponse(
      res,
      200,
      "Banner fetched successfully",
      banner
    );
  }
);