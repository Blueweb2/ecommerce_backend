import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { Designer } from "./designer.model";
import { AppError } from "../../utils/AppError";
import { signAccessToken, signRefreshToken } from "../../config/jwt";

export const loginDesigner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    const designer = await Designer.findOne({ email }).select("+password");

    if (!designer || !designer.password) {
      return next(new AppError("Invalid credentials", 401));
    }

    const isMatch = await bcrypt.compare(password, designer.password);
    if (!isMatch) {
      return next(new AppError("Invalid credentials", 401));
    }

    if (!designer.isActive) {
      return next(new AppError("Your account has been deactivated", 403));
    }

    designer.lastLogin = new Date();
    await designer.save();

    const accessToken = signAccessToken({
      id: designer._id.toString(),
      role: "designer",
    });

    const refreshToken = signRefreshToken({
      id: designer._id.toString(),
      role: "designer",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: designer._id,
        name: designer.name,
        email: designer.email,
        brandName: designer.brandName,
        role: "designer",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutDesigner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = (req as any).designer?.id;
    if (!designerId) {
      return next(new AppError("Not authenticated", 401));
    }

    const designer = await Designer.findById(designerId);
    if (!designer) {
      return next(new AppError("Designer not found", 404));
    }

    res.status(200).json({
      success: true,
      data: designer,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const designerId = (req as any).designer?.id;

    if (!designerId) {
      return next(new AppError("Not authenticated", 401));
    }

    const designer = await Designer.findById(designerId).select("+password");
    if (!designer || !designer.password) {
      return next(new AppError("Designer not found", 404));
    }

    const isMatch = await bcrypt.compare(currentPassword, designer.password);
    if (!isMatch) {
      return next(new AppError("Incorrect current password", 401));
    }

    const salt = await bcrypt.genSalt(10);
    designer.password = await bcrypt.hash(newPassword, salt);
    await designer.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};
