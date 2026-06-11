import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { Designer } from "./designer.model";
import { AppError } from "../../utils/AppError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../config/jwt";

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

    const payload = {
      id: designer._id.toString(),
      role: "designer",
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store refresh token on designer record
    (designer as any).refreshToken = refreshToken;
    await designer.save();

    // Use a SEPARATE cookie name to avoid collision with customer refreshToken
    res.cookie("designerRefreshToken", refreshToken, {
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
      token: accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Designer-Isolated Refresh Token ─────────────────────────────────────────
// POST /designers/auth/refresh-token
// Uses "designerRefreshToken" cookie — never touches User collection.

export const refreshDesignerToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.designerRefreshToken;

    if (!token) {
      return next(new AppError("No designer refresh token", 401));
    }

    let decoded: any;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return next(new AppError("Invalid or expired designer refresh token", 401));
    }

    // ONLY look in the Designer collection
const designer = await Designer.findById(decoded.id)
  .select("+refreshToken");

if (!designer) {
  throw new AppError("Designer not found", 401);
}

if (designer.refreshToken !== token) {
  throw new AppError("Invalid refresh token", 401);
}
   

    if (!designer.isActive) {
      return next(new AppError("Designer account is deactivated", 403));
    }

    const newPayload = {
      id: designer._id.toString(),
      role: "designer",
    };

    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    // Rotate refresh token
    (designer as any).refreshToken = newRefreshToken;
    await designer.save();

    res.cookie("designerRefreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
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
    const designerId = req.designer?.id;

    if (designerId) {
      await Designer.findByIdAndUpdate(
        designerId,
        {
          refreshToken: null,
        }
      );
    }

    res.clearCookie("designerRefreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
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
