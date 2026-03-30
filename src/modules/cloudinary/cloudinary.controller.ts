import { Request, Response } from "express";
import crypto from "crypto";
import { deleteImageFromCloudinary } from "./cloudinary.service";
import { asyncHandler } from "../../utils/asyncHandler";

export const getSignature = (req: Request, res: Response) => {
  const timestamp = Math.round(Date.now() / 1000);

  const folder = req.query.folder || "products"; // ✅ dynamic

  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUD_API_SECRET}`;

  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign)
    .digest("hex");

  res.json({
    timestamp,
    signature,
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.CLOUD_API_KEY,
    folder, // optional but useful
  });
};



export const deleteImageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ message: "public_id is required" });
    }

    await deleteImageFromCloudinary(public_id);

    res.json({ message: "Image deleted successfully" });
  }
);