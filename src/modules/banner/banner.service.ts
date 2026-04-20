import { Banner } from "./banner.model";
import {
  IBanner,
  IBannerDocument,
  IBannerGrouped,
} from "./banner.types";
import cloudinary from "../../config/cloudinary";

/**
 * 🛠 Map DB Document to Service Document
 * Handles _id conversion from ObjectId to String
 */
const mapToDoc = (doc: any): IBannerDocument => {
  if (!doc) return doc;
  
  // Convert _id if it's an ObjectId or exists
  const id = doc._id ? doc._id.toString() : "";
  
  return {
    ...doc,
    _id: id,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

// ✅ CREATE
export const createBanner = async (
  data: IBanner
): Promise<IBannerDocument> => {
  // 🔥 enforce single-slot banners
  if (["center", "rightTop", "rightBottom"].includes(data.position)) {
    const existing = await Banner.findOne({ position: data.position });

    if (existing?.image?.public_id) {
      await cloudinary.uploader.destroy(existing.image.public_id);
    }

    await Banner.findOneAndDelete({ position: data.position });
  }

  const banner = await Banner.create(data);
  return mapToDoc(banner.toObject());
};

// ✅ GET
export const getBanners = async (): Promise<IBannerGrouped> => {
  const banners = await Banner.find({ isActive: true })
    .sort({ order: 1 })
    .lean();

  const mapped = banners.map(mapToDoc);

  return {
    hero: mapped.filter((b) => b.position === "hero"),
    center: mapped.find((b) => b.position === "center") || null,
    rightTop: mapped.find((b) => b.position === "rightTop") || null,
    rightBottom:
      mapped.find((b) => b.position === "rightBottom") || null,
  };
};

// ✅ DELETE (WITH CLOUDINARY)
export const deleteBanner = async (
  id: string
): Promise<IBannerDocument | null> => {
  const doc = await Banner.findById(id);

  if (!doc) return null;

  if (doc.image?.public_id) {
    await cloudinary.uploader.destroy(doc.image.public_id);
  }

  await doc.deleteOne();

  return mapToDoc(doc.toObject());
};

// ✅ UPDATE
export const updateBanner = async (
  id: string,
  data: Partial<IBanner>
): Promise<IBannerDocument | null> => {
  const existing = await Banner.findById(id);

  if (!existing) return null;

  // 🔥 delete old image if changed
  if (
    data.image?.public_id &&
    existing.image?.public_id &&
    data.image.public_id !== existing.image.public_id
  ) {
    await cloudinary.uploader.destroy(existing.image.public_id);
  }

  const updated = await Banner.findByIdAndUpdate(id, data, {
    new: true,
  }).lean();

  return updated ? mapToDoc(updated) : null;
};

// ✅ GET ONE
export const getBannerById = async (
  id: string
): Promise<IBannerDocument | null> => {
  const doc = await Banner.findById(id).lean();
  return doc ? mapToDoc(doc) : null;
};