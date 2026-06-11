import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { AppError } from "../../utils/AppError";
import { Designer } from "./designer.model";
import { IDesigner } from "./designer.types";
import { buildUniqueDesignerSlug, escapeRegex } from "./designer.utils";
import { sendEmail } from "../../utils/sendEmail";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminCreateDesignerPayload = {
  name: string;
  email: string;
  password?: string;
};

type DesignerProfilePayload = {
  brandName?: string;
  description?: string;
  businessName?: string;
  phone?: string;
  gstNumber?: string;
  website?: string;
  categories?: string[];
  address?: IDesigner["address"];
  socialLinks?: IDesigner["socialLinks"];
  avatar?: IDesigner["avatar"];
  brandImage?: IDesigner["brandImage"];
  bannerImage?: IDesigner["bannerImage"];
};

type AdminStorefrontPayload = {
  isFeatured?: boolean;
  isFavorite?: boolean;
  isActive?: boolean;
};

type DesignerListOptions = {
  isFavorite?: boolean;
  isActive?: boolean;
  isVerified?: boolean;
  verificationStatus?: "pending" | "approved" | "rejected";
  search?: string;
  page?: number;
  limit?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
      { email: regex },
      { description: regex },
      { slug: regex },
    ],
  };
};

// ─── Compute profile completion percentage ────────────────────────────────────

const computeProfileCompleted = (designer: IDesigner): boolean => {
  const hasBrand = !!(designer.brandName?.trim() && designer.description?.trim());
  const hasBusiness = !!(designer.businessName?.trim() || designer.phone?.trim());
  const hasAddress = !!(designer.address?.city?.trim());
  const hasCategories = !!(designer.categories && designer.categories.length > 0);
  const hasImages = !!(designer.avatar?.url || designer.brandImage?.url);

  // Mark completed when at least brand info + 2 other sections are done
  const sections = [hasBrand, hasBusiness, hasAddress, hasCategories, hasImages];
  const completedCount = sections.filter(Boolean).length;
  return hasBrand && completedCount >= 3;
};

// ─── Admin: Create designer account ──────────────────────────────────────────

export const createDesignerService = async (payload: AdminCreateDesignerPayload) => {
  if (!payload.name?.trim()) {
    throw new AppError("Name is required", 400);
  }

  if (!payload.email?.trim()) {
    throw new AppError("Email is required", 400);
  }

  // Check for duplicate email
  const existing = await Designer.findOne({
    email: payload.email.toLowerCase().trim(),
  });
  if (existing) {
    throw new AppError("A designer with this email already exists", 409);
  }

  const slug = await buildUniqueDesignerSlug(payload.name);

  // Use provided password or generate a random one
  const rawPassword = payload.password?.trim() || crypto.randomBytes(6).toString("hex");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(rawPassword, salt);

  try {
    const newDesigner = await Designer.create({
      name: payload.name.trim(),
      email: payload.email.toLowerCase().trim(),
      password: hashedPassword,
      slug,
      brandName: payload.name.trim(), // placeholder until designer fills profile
      description: "",
      isActive: true,
      profileCompleted: false,
      isVerified: false,
      verificationStatus: "pending",
    });

    // Send welcome email with login credentials
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Welcome to Zenfaz, ${payload.name}!</h1>
          <p>Your designer account has been created. Please log in and complete your profile.</p>
          <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Login URL:</strong> ${process.env.FRONTEND_URL || "https://yoursite.com"}/designer/login</p>
            <p><strong>Email:</strong> ${payload.email}</p>
            <p><strong>Password:</strong> <code style="background: #e8e8e8; padding: 2px 6px; border-radius: 4px;">${rawPassword}</code></p>
          </div>
          <p style="color: #666; font-size: 14px;">Please change your password after your first login.</p>
        </div>
      `;
      await sendEmail(payload.email, "Your Designer Account — Zenfaz", emailHtml);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Non-fatal: account created, email failed
    }

    return newDesigner;
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.slug) {
      throw new AppError("Designer slug already exists", 409);
    }
    if (error?.code === 11000 && error?.keyPattern?.email) {
      throw new AppError("A designer with this email already exists", 409);
    }
    throw error;
  }
};

// ─── Designer: Update own profile ────────────────────────────────────────────

export const updateDesignerProfileService = async (
  designerId: string,
  payload: DesignerProfilePayload
) => {
  ensureValidDesignerId(designerId);

  const designer = await Designer.findById(designerId);
  if (!designer) {
    throw new AppError("Designer not found", 404);
  }

  // Apply profile field updates
  if (typeof payload.brandName !== "undefined") designer.brandName = payload.brandName;
  if (typeof payload.description !== "undefined") designer.description = payload.description;
  if (typeof payload.businessName !== "undefined") designer.businessName = payload.businessName;
  if (typeof payload.phone !== "undefined") designer.phone = payload.phone;
  if (typeof payload.gstNumber !== "undefined") designer.gstNumber = payload.gstNumber;
  if (typeof payload.website !== "undefined") designer.website = payload.website;
  if (typeof payload.categories !== "undefined") {
    designer.categories = payload.categories as any;
  }
  if (typeof payload.address !== "undefined") designer.address = payload.address;
  if (typeof payload.socialLinks !== "undefined") designer.socialLinks = payload.socialLinks;
  if (typeof payload.avatar !== "undefined") designer.avatar = payload.avatar;
  if (typeof payload.brandImage !== "undefined") designer.brandImage = payload.brandImage;
  if (typeof payload.bannerImage !== "undefined") designer.bannerImage = payload.bannerImage;

  // Recompute profile completion
  designer.profileCompleted = computeProfileCompleted(designer);

  await designer.save();
  return designer;
};

// ─── Admin: Update storefront controls ───────────────────────────────────────

export const updateDesignerStorefrontService = async (
  id: string,
  payload: AdminStorefrontPayload
) => {
  ensureValidDesignerId(id);

  const designer = await Designer.findById(id);
  if (!designer) {
    throw new AppError("Designer not found", 404);
  }

  if (typeof payload.isFeatured === "boolean") designer.isFeatured = payload.isFeatured;
  if (typeof payload.isFavorite === "boolean") designer.isFavorite = payload.isFavorite;
  if (typeof payload.isActive === "boolean") designer.isActive = payload.isActive;

  await designer.save();
  return designer;
};

// ─── Admin: Approve designer ──────────────────────────────────────────────────

export const approveDesignerService = async (id: string) => {
  ensureValidDesignerId(id);

  const designer = await Designer.findByIdAndUpdate(
    id,
    { isVerified: true, verificationStatus: "approved", isActive: true },
    { new: true }
  );

  if (!designer) {
    throw new AppError("Designer not found", 404);
  }

  // Send approval email
  if (designer.email) {
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Congratulations, ${designer.name}!</h1>
          <p>Your designer account has been approved. You can now list products on our platform.</p>
          <p><a href="${process.env.FRONTEND_URL || "https://yoursite.com"}/designer/dashboard" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Go to Dashboard</a></p>
        </div>
      `;
      await sendEmail(designer.email, "Account Approved — Zenfaz", emailHtml);
    } catch (err) {
      console.error("Failed to send approval email:", err);
    }
  }

  return designer;
};

// ─── Admin: Reject designer ───────────────────────────────────────────────────

export const rejectDesignerService = async (id: string, reason?: string) => {
  ensureValidDesignerId(id);

  const designer = await Designer.findByIdAndUpdate(
    id,
    { isVerified: false, verificationStatus: "rejected" },
    { new: true }
  );

  if (!designer) {
    throw new AppError("Designer not found", 404);
  }

  if (designer.email) {
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Application Update</h1>
          <p>Dear ${designer.name}, your designer application has not been approved at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>Please contact support if you have any questions.</p>
        </div>
      `;
      await sendEmail(designer.email, "Application Status — Zenfaz", emailHtml);
    } catch (err) {
      console.error("Failed to send rejection email:", err);
    }
  }

  return designer;
};

// ─── Admin: Reset password ────────────────────────────────────────────────────

export const adminResetPasswordService = async (id: string) => {
  ensureValidDesignerId(id);

  const designer = await Designer.findById(id).select("+password");
  if (!designer) {
    throw new AppError("Designer not found", 404);
  }

  if (!designer.email) {
    throw new AppError("Designer does not have an email address on file", 400);
  }

  const rawPassword = crypto.randomBytes(6).toString("hex");
  const salt = await bcrypt.genSalt(10);
  designer.password = await bcrypt.hash(rawPassword, salt);
  await designer.save();

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a1a;">Password Reset</h1>
      <p>Your password has been reset by an administrator.</p>
      <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p><strong>New Password:</strong> <code style="background: #e8e8e8; padding: 2px 6px; border-radius: 4px;">${rawPassword}</code></p>
      </div>
      <p style="color: #666; font-size: 14px;">Please change your password immediately after logging in.</p>
    </div>
  `;
  await sendEmail(designer.email, "Password Reset — Zenfaz", emailHtml);

  return { message: `Password reset email sent to ${designer.email}` };
};

// ─── Read queries ─────────────────────────────────────────────────────────────

export const getDesignerBySlugService = async (
  slug: string,
  filters: Record<string, unknown> = {}
) => {
  return Designer.findOne({ slug, ...filters });
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

  return Designer.findOne(query).populate("categories", "name slug");
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

  if (typeof options.isVerified === "boolean") {
    query.isVerified = options.isVerified;
  }

  if (options.verificationStatus) {
    query.verificationStatus = options.verificationStatus;
  }

  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const [designers, total] = await Promise.all([
    Designer.find(query)
      .populate("categories", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Designer.countDocuments(query),
  ]);

  return {
    designers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ─── Update (admin full) & Delete ─────────────────────────────────────────────

export const updateDesignerService = async (
  id: string,
  payload: Partial<DesignerProfilePayload & AdminStorefrontPayload & { name?: string; password?: string }>
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

  if (typeof payload.description !== "undefined") designer.description = payload.description;
  if (typeof payload.brandName !== "undefined") designer.brandName = payload.brandName;
  if (typeof payload.avatar !== "undefined") designer.avatar = payload.avatar;
  if (typeof payload.brandImage !== "undefined") designer.brandImage = payload.brandImage;
  if (typeof payload.bannerImage !== "undefined") designer.bannerImage = payload.bannerImage;
  if (typeof payload.isFavorite === "boolean") designer.isFavorite = payload.isFavorite;
  if (typeof payload.isActive === "boolean") designer.isActive = payload.isActive;
  if (typeof payload.isFeatured === "boolean") designer.isFeatured = payload.isFeatured;
  if (typeof payload.businessName !== "undefined") designer.businessName = payload.businessName;
  if (typeof payload.phone !== "undefined") designer.phone = payload.phone;
  if (typeof payload.gstNumber !== "undefined") designer.gstNumber = payload.gstNumber;
  if (typeof payload.website !== "undefined") designer.website = payload.website;
  if (typeof payload.categories !== "undefined") designer.categories = payload.categories as any;
  if (typeof payload.address !== "undefined") designer.address = payload.address;
  if (typeof payload.socialLinks !== "undefined") designer.socialLinks = payload.socialLinks;

  if (payload.password) {
    const salt = await bcrypt.genSalt(10);
    designer.password = await bcrypt.hash(payload.password, salt);
  }

  designer.profileCompleted = computeProfileCompleted(designer);

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
