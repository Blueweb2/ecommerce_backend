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
import { sendEmail } from "../../utils/sendEmail";

// ✅ GET ME
export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  res.json({ user: safeUser });
});

// ✅ REGISTER
export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  // 🔍 Check existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  // 🔐 Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 👤 Create user
  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role: "user",
    isActive: true,
    emailVerified: false,
  });

  // 🔥 Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  newUser.verificationCode = otp;
  newUser.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

  await newUser.save();

  // 📧 Send OTP Email
  await sendEmail(
    newUser.email,
    "Verify Your Email - OTP",
    `
      <div style="font-family: Arial, sans-serif;">
        <h2>Email Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `
  );

  // ✅ Response (NO TOKEN HERE)
  return res.status(201).json({
    success: true,
    message: "OTP sent to your email. Please verify your account.",
  });
});

// ✅ LOGIN
export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 🔤 Normalize email
  const emailNormalized = email.trim().toLowerCase();

  const user = await User.findOne({ email: emailNormalized }).select("+password");

  if (!user || !user.password) {
    throw new AppError("Invalid credentials", 400);
  }

  // ❌ Check inactive user
  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }

  // 🔐 Check password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Invalid credentials", 400);
  }

  // 🔥 Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.verificationCode = otp;
  user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

  await user.save();

  // 📧 Send OTP Email
  await sendEmail(
    user.email,
    "Login OTP - Verify Your Account",
    `
      <div style="font-family: Arial, sans-serif;">
        <h2>Login Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `
  );

  const isDev = process.env.NODE_ENV !== "production";

  return res.json({
    success: true,
    message: "OTP sent to your email",
    ...(isDev && { otp }), // 🔥 only in dev
  });
});

export const verifyOtpHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const emailNormalized = email.trim().toLowerCase();

    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.isActive) {
      throw new AppError("Account is deactivated", 403);
    }

    // 🔥 FIXED OTP CHECK
    if (
      String(user.verificationCode) !== String(otp) ||
      !user.verificationExpires ||
      user.verificationExpires < new Date()
    ) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    // ✅ Mark verified
    user.emailVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;

    // 🔐 Generate tokens
    const payload = { id: user._id, role: user.role };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshToken = refreshToken;

    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // ✅ SEND USER ALSO
    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.json({
      success: true,
      message: "Account verified successfully",
      accessToken,
      user: safeUser,
    });
  }
);

export const resendOtpHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    // 🔤 Normalize email
    const emailNormalized = email.trim().toLowerCase();

    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // ❌ Check inactive user
    if (!user.isActive) {
      throw new AppError("Account is deactivated", 403);
    }

    // 🔥 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationCode = otp;
    user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    // 📧 Send email
    await sendEmail(
      user.email,
      "Resend OTP - Verification Code",
      `
        <div style="font-family: Arial, sans-serif;">
          <h2>OTP Verification</h2>
          <p>Your new OTP code is:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This OTP will expire in 10 minutes.</p>
        </div>
      `
    );

    return res.json({
      success: true,
      message: "OTP resent successfully",
    });
  }
);



// ✅ REFRESH TOKEN
export const refreshTokenHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;

    if (!token) {
      throw new AppError("No refresh token", 401);
    }



    const decoded = verifyRefreshToken(token) as any;

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError("User not found", 401);
    }

    // rotate token
    const newRefreshToken = signRefreshToken({
      id: decoded.id,
      role: decoded.role,
    });

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false, // dev
      sameSite: "lax",
    });

    const accessToken = signAccessToken({
      id: decoded.id,
      role: decoded.role,
    });

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  }
);

// ✅ LOGOUT
export const logoutHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // ✅ Remove refresh token from DB
    if (req.user?.id) {
      const user = await User.findById(req.user.id);

      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    // ✅ Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
);

// ✅ GET ALL CUSTOMERS (Admin + Superadmin)
export const getCustomersHandler = asyncHandler(async (req: Request, res: Response) => {
  const customers = await User.find({ role: "user" }).select("-password");
  res.json({ data: customers });
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
// ✅ UPDATE PROFILE (Name, Phone)
export const updateProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;

  await user.save();

  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };

  res.json({ success: true, user: safeUser });
});

// ✅ CHANGE PASSWORD
export const changePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Check old password
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new AppError("Old password is incorrect", 400);
  }

  // Hash and save new password
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ success: true, message: "Password changed successfully" });
});

// ✅ REQUEST EMAIL CHANGE (Send OTP to NEW email)
export const requestEmailChangeHandler = asyncHandler(async (req: Request, res: Response) => {
  const { newEmail } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (newEmail === user.email) {
    throw new AppError("New email must be different from current email", 400);
  }

  // Check if new email is already in use
  const existingUser = await User.findOne({ email: newEmail });
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = otp;
  user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

  await user.save();

  // Send OTP to NEW email
  await sendEmail(
    newEmail,
    "Verify Your New Email - OTP",
    `
      <div style="font-family: Arial, sans-serif;">
        <h2>Email Change Verification</h2>
        <p>You requested to change your email to this address. Your OTP code is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `
  );

  res.json({ success: true, message: "OTP sent to your new email address" });
});

// ✅ VERIFY EMAIL CHANGE
export const verifyEmailChangeHandler = asyncHandler(async (req: Request, res: Response) => {
  const { newEmail, otp } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (
    String(user.verificationCode) !== String(otp) ||
    !user.verificationExpires ||
    user.verificationExpires < new Date()
  ) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  // Check again if new email is already in use (race condition)
  const existingUser = await User.findOne({ email: newEmail });
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  // Update email
  user.email = newEmail;
  user.verificationCode = undefined;
  user.verificationExpires = undefined;
  user.emailVerified = true;

  await user.save();

  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  res.json({ success: true, message: "Email updated successfully", user: safeUser });
});
