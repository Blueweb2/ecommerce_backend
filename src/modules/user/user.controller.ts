import { Request, Response } from "express";
import * as userService from "./user.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/response";
import { signAccessToken, signRefreshToken } from "../../config/jwt";
import bcrypt from "bcryptjs";
/* =========================
   REGISTER
========================= */
export const registerHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await userService.registerUser(req.body);

    // const token = generateToken({
    //   id: user._id,
    //   email: user.email,
    //   role: user.role,
    // });
    const accessToken = signAccessToken({
      id: user._id,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      id: user._id,
      role: user.role,
    });

    // ✅ set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ save in DB
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    console.log("Incoming refreshToken user:", refreshToken);
        console.log("Incoming refreshToken user .user:", refreshToken);


    await user.save({ validateBeforeSave: false });

    sendResponse(res, 201, "User registered successfully", {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
      accessToken,
    });
  }
);

/* =========================
   LOGIN
========================= */
export const loginHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await userService.loginUser(req.body);

    if (!user.isActive) {
  throw new AppError("Account is deactivated", 403);
}

    // const token = generateToken({
    //   id: user._id,
    //   email: user.email,
    //   role: user.role,
    // });
    const accessToken = signAccessToken({
      id: user._id,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      id: user._id,
      role: user.role,
    });

    // ✅ set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ save in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    sendResponse(res, 200, "Login successful", {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
      accessToken,
    });
  }
);

/* =========================
   GET PROFILE
========================= */
export const getMeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    const user = await userService.getUserById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    sendResponse(res, 200, "User profile fetched", {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
    });
  }
);

/* =========================
   UPDATE PROFILE
========================= */
export const updateProfileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    const user = await userService.updateUser(userId, req.body);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    sendResponse(res, 200, "Profile updated successfully", {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
    });
  }
);

/* =========================
   CREATE ADMIN (SUPERADMIN ONLY)
========================= */
export const createAdminHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const admin = await userService.createAdminUser({
      ...req.body,
      role: "admin", //  force role (security)
    });

    sendResponse(res, 201, "Admin created successfully", {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      isActive: admin.isActive,
    });
  }
);

/* =========================
   CREATE SUPERADMIN (TEMPORARY)
========================= */
export const createSuperAdminHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { masterKey, ...userData } = req.body;

    // 🔍 Debug (optional, remove later)
    // console.log("ENV:", process.env.MASTER_KEY);
    // console.log("BODY:", masterKey);

    const keyFromEnv = process.env.MASTER_KEY?.trim();
    const keyFromBody = masterKey?.trim();

    if (!keyFromBody || keyFromBody !== keyFromEnv) {
      throw new AppError("Invalid master key", 403);
    }

    const superAdmin = await userService.createSuperAdminUser({
      ...userData,
      role: "superadmin", //  enforce role
    });

    sendResponse(res, 201, "Superadmin created successfully", {
      _id: superAdmin._id,
      name: superAdmin.name,
      email: superAdmin.email,
      phone: superAdmin.phone,
      role: superAdmin.role,
      isActive: superAdmin.isActive,
    });
  }
);

export const getCustomersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const users = await userService.getCustomers();
    sendResponse(res, 200, "Customers fetched", users);
  }
);

/* =========================
   GET ADMINS (SUPERADMIN ONLY)
========================= */
export const getAdminsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const admins = await userService.getAdmins();

    sendResponse(res, 200, "Admins fetched successfully", admins);
  }
);


export const getAdminByIdHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const admin = await userService.getAdminById(req.params.id as string);

    sendResponse(res, 200, "Admin fetched successfully", admin);
  }
);



export const updateAdminHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const admin = await userService.updateAdmin(
      req.params.id as string,
      req.body
    );

    sendResponse(res, 200, "Admin updated successfully", admin);
  }
);


export const deleteAdminHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await userService.deleteAdmin(req.params.id as string);

    sendResponse(res, 200, "Admin deleted successfully", null);
  }
);