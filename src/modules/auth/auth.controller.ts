import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../config/jwt";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { User } from "../user/user.model";

// ✅ GET ME
export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({ user });
});

// ✅ LOGIN
export const loginHandler = asyncHandler(async (req: Request, res: Response) => {

  // 🔐 password check

  const { email, password } = req.body;

const user = await User.findOne({ email }).select("+password");

if (!user || !user.password) {
  return res.status(400).json({
    success: false,
    message: "Invalid credentials",
  });
}

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
  return res.status(400).json({
    success: false,
    message: "Invalid credentials",
  });
}
  const payload = { id: user._id, role: user.role };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  res.json({
    accessToken,
    user: safeUser,
  });
});

// ✅ REFRESH TOKEN
export const refreshTokenHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;

    if (!token) {
      throw new AppError("No refresh token", 401);
    }

    const decoded = verifyRefreshToken(token) as any;

    const accessToken = signAccessToken({
      id: decoded.id,
      role: decoded.role,
    });

    res.json({ accessToken });
  }
);

// ✅ LOGOUT
export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

// ✅ GET ALL ADMINS (Superadmin only)
export const getAdminsHandler = asyncHandler(async (req: Request, res: Response) => {
  const admins = await User.find({ role: { $in: ["admin", "superadmin"] } }).select("-password");
  res.json({ data: admins });
});

// ✅ GET SINGLE ADMIN
export const getAdminByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = await User.findById(req.params.id).select("-password");
  if (!admin) {
    throw new AppError("Admin not found", 404);
  }
  res.json({ data: admin });
});

// ✅ CREATE ADMIN
export const createAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newAdmin = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role: "admin",
    isActive: true,
  });

  const { password: _password, ...safeAdmin } = newAdmin.toObject();

  res.status(201).json({ data: safeAdmin });
});

// ✅ UPDATE ADMIN
export const updateAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, isActive } = req.body;
  const adminId = req.params.id;

  const admin = await User.findById(adminId);
  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  if (email && email !== admin.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw new AppError("Email already in use", 400);
    }
    admin.email = email;
  }

  if (name) admin.name = name;
  if (phone) admin.phone = phone;
  if (isActive !== undefined) admin.isActive = isActive;

  if (password) {
    admin.password = await bcrypt.hash(password, 10);
  }

  await admin.save();

  const { password: _password, ...safeAdmin } = admin.toObject();

  res.json({ data: safeAdmin });
});

// ✅ DELETE ADMIN
export const deleteAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.params.id;

  const admin = await User.findById(adminId);
  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  if (admin.role === "superadmin" && admin.id === req.user?.id) {
    throw new AppError("You cannot delete your own superadmin account", 400);
  }

  await admin.deleteOne();
  
  res.json({ message: "Admin deleted successfully" });
});
