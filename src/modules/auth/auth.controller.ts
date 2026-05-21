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
import { PendingUser } from "../user/pendingUser.model";
import { sendEmail } from "../../utils/sendEmail";
import crypto from "crypto";
import { env } from "../../config/env";

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

  const emailNormalized = email.trim().toLowerCase();

  // 🔍 Check existing user in main table
  const existingUser = await User.findOne({ email: emailNormalized });
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  // 🔐 Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 🧹 Delete any existing pending registrations for this email
  await PendingUser.deleteMany({ email: emailNormalized });

  // 🔥 Generate OTPs
  const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();

  // 👤 Create pending user record (will expire in 15 mins)
  await PendingUser.create({
    name,
    email: emailNormalized,
    password: hashedPassword,
    phone,
    emailOtp,
    emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    phoneOtp,
    phoneOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    emailVerified: false,
    phoneVerified: false,
  });

  // 📧 Send OTP Email
  await sendEmail(
    emailNormalized,
    "Verify Your Email - OTP",
    `
      <div style="font-family: Arial, sans-serif;">
        <h2>Email Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 4px;">${emailOtp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `
  );

  // 📱 Simulate SMS sending in console
  console.log(`\n📱 [SIMULATED SMS] Sent Phone Verification OTP to ${phone || "user"}: ${phoneOtp}\n`);

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

  // 🔍 Find in main table
  const user = await User.findOne({ email: emailNormalized }).select("+password");

  if (!user) {
    // 🔍 Check if registration is pending
    const pendingUser = await PendingUser.findOne({ email: emailNormalized });
    if (pendingUser) {
      // Trigger new OTP codes
      const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();

      pendingUser.emailOtp = emailOtp;
      pendingUser.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      pendingUser.phoneOtp = phoneOtp;
      pendingUser.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await pendingUser.save();

      // Dispatch
      await sendEmail(
        emailNormalized,
        "Verify Your Email - OTP",
        `
          <div style="font-family: Arial, sans-serif;">
            <h2>Email Verification</h2>
            <p>Your OTP code is:</p>
            <h1 style="letter-spacing: 4px;">${emailOtp}</h1>
            <p>This OTP will expire in 10 minutes.</p>
          </div>
        `
      );

      console.log(`\n📱 [SIMULATED SMS] Sent Phone Verification OTP to ${pendingUser.phone || "user"}: ${phoneOtp}\n`);

      return res.json({
        success: true,
        emailVerified: pendingUser.emailVerified,
        phoneVerified: pendingUser.phoneVerified,
        message: "Registration pending. OTP sent to complete registration.",
        redirectVerify: true,
      });
    }

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

  // 🚨 If email not verified (Safety check for legacy profiles):
  if (!user.emailVerified) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = otp;
    user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail(
      user.email,
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

    return res.json({
      success: true,
      emailVerified: false,
      phoneVerified: false,
      message: "Email verification required. OTP sent to your email.",
    });
  }

  // 🚨 If phone exists but not verified (Safety check for legacy profiles):
  if (user.phone && !user.phoneVerified) {
    const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.phoneVerificationCode = phoneOtp;
    user.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Simulate SMS
    console.log(`\n📱 [SIMULATED SMS] Sent Phone Verification OTP to ${user.phone}: ${phoneOtp}\n`);

    return res.json({
      success: true,
      emailVerified: true,
      phoneVerified: false,
      message: "Mobile number verification required. OTP sent to your phone.",
    });
  }

  // 🔥 Generate OTP for standard fully verified login
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

// ✅ VERIFY OTP
export const verifyOtpHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const emailNormalized = email.trim().toLowerCase();

    // 🔍 Check if user is already verified and fully registered in the main table
    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      if (
        String(existingUser.verificationCode) !== String(otp) ||
        !existingUser.verificationExpires ||
        existingUser.verificationExpires < new Date()
      ) {
        throw new AppError("Invalid or expired OTP", 400);
      }

      existingUser.emailVerified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationExpires = undefined;
      await existingUser.save();

      const payload = { id: existingUser._id, role: existingUser.role };
      const accessToken = signAccessToken(payload);
      const refreshToken = signRefreshToken(payload);

      existingUser.refreshToken = refreshToken;
      await existingUser.save();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return res.json({
        success: true,
        message: "Account verified successfully",
        accessToken,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          phone: existingUser.phone,
        },
        emailVerified: true,
        phoneVerified: true,
      });
    }

    // 🔍 Otherwise, find matching PendingUser record
    const pendingUser = await PendingUser.findOne({ email: emailNormalized });

    if (!pendingUser) {
      throw new AppError("Registration session expired. Please register again.", 404);
    }

    // Validate OTP
    if (
      String(pendingUser.emailOtp) !== String(otp) ||
      !pendingUser.emailOtpExpires ||
      pendingUser.emailOtpExpires < new Date()
    ) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    // Mark verified
    pendingUser.emailVerified = true;
    await pendingUser.save();

    // 🚨 Sequential Phone Verification Check
    if (pendingUser.phone && !pendingUser.phoneVerified) {
      return res.json({
        success: true,
        emailVerified: true,
        phoneVerified: false,
        message: "Email verified. Please verify your mobile number.",
      });
    }

    // Create User (both verified)
    const newUser = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      phone: pendingUser.phone,
      role: "user",
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    });

    await pendingUser.deleteOne();

    const payload = { id: newUser._id, role: newUser.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.json({
      success: true,
      message: "Account verified successfully",
      accessToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
      },
      emailVerified: true,
      phoneVerified: true,
    });
  }
);

// ✅ RESEND OTP
export const resendOtpHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const emailNormalized = email.trim().toLowerCase();

    // Check main User first
    const user = await User.findOne({ email: emailNormalized });
    if (user) {
      if (!user.isActive) {
        throw new AppError("Account is deactivated", 403);
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = otp;
      user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

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

    // Check pending user
    const pendingUser = await PendingUser.findOne({ email: emailNormalized });
    if (!pendingUser) {
      throw new AppError("Registration session expired. Please register again.", 404);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pendingUser.emailOtp = otp;
    pendingUser.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await pendingUser.save();

    await sendEmail(
      pendingUser.email,
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

// ✅ VERIFY PHONE OTP
export const verifyPhoneOtpHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const emailNormalized = email.trim().toLowerCase();

    // Check if main User already exists (for cases where user already registered but logging in requires phone verification)
    const user = await User.findOne({ email: emailNormalized });
    if (user) {
      if (!user.isActive) {
        throw new AppError("Account is deactivated", 403);
      }
      if (
        String(user.phoneVerificationCode) !== String(otp) ||
        !user.phoneVerificationExpires ||
        user.phoneVerificationExpires < new Date()
      ) {
        throw new AppError("Invalid or expired OTP", 400);
      }

      user.phoneVerified = true;
      user.phoneVerificationCode = null;
      user.phoneVerificationExpires = null;

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

      return res.json({
        success: true,
        message: "Mobile number verified successfully",
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
        emailVerified: user.emailVerified,
        phoneVerified: true,
      });
    }

    // Check PendingUser
    const pendingUser = await PendingUser.findOne({ email: emailNormalized });
    if (!pendingUser) {
      throw new AppError("Registration session expired. Please register again.", 404);
    }

    // Check Phone OTP
    if (
      String(pendingUser.phoneOtp) !== String(otp) ||
      !pendingUser.phoneOtpExpires ||
      pendingUser.phoneOtpExpires < new Date()
    ) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    // Mark verified & CREATE user in actual User collection!
    const newUser = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // already hashed
      phone: pendingUser.phone,
      role: "user",
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    });

    await pendingUser.deleteOne();

    // 🔐 Generate tokens
    const payload = { id: newUser._id, role: newUser.role };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    const safeUser = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
    };

    return res.json({
      success: true,
      message: "Mobile number verified successfully",
      accessToken,
      user: safeUser,
      emailVerified: true,
      phoneVerified: true,
    });
  }
);

// ✅ RESEND PHONE OTP
export const resendPhoneOtpHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const emailNormalized = email.trim().toLowerCase();

    // Check main User
    const user = await User.findOne({ email: emailNormalized });
    if (user) {
      if (!user.isActive) {
        throw new AppError("Account is deactivated", 403);
      }
      const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.phoneVerificationCode = phoneOtp;
      user.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      console.log(`\n📱 [SIMULATED SMS] Resent Phone Verification OTP to ${user.phone || "user"}: ${phoneOtp}\n`);

      return res.json({
        success: true,
        message: "Phone OTP resent successfully",
      });
    }

    // Check pending user
    const pendingUser = await PendingUser.findOne({ email: emailNormalized });
    if (!pendingUser) {
      throw new AppError("Registration session expired. Please register again.", 404);
    }

    const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
    pendingUser.phoneOtp = phoneOtp;
    pendingUser.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await pendingUser.save();

    console.log(`\n📱 [SIMULATED SMS] Resent Phone Verification OTP to ${pendingUser.phone || "user"}: ${phoneOtp}\n`);

    return res.json({
      success: true,
      message: "Phone OTP resent successfully",
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

// ✅ FORGOT PASSWORD
export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const emailNormalized = email.trim().toLowerCase();
  const user = await User.findOne({ email: emailNormalized });

  // For security, don't reveal if user doesn't exist, just say success
  if (!user) {
    res.json({
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    });
    return;
  }

  // Generate a random 32-character reset token
  const resetToken = crypto.randomBytes(16).toString("hex");

  // Save token and expiry (1 hour)
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 3600 * 1000);
  await user.save();

  const frontendUrl = env.CLIENT_URL || "http://localhost:3000";
  const resetLink = `${frontendUrl}/account/reset-password?token=${resetToken}&email=${emailNormalized}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px;">
      <h2 style="color: #1a1f1a;">Zenfaz Password Reset</h2>
      <p>You requested a password reset for your ZENFAZ account.</p>
      <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
      <div style="margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #1a1f1a; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #666; font-size: 12px;">If you didn't request this email, please ignore it.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 11px;">If the button above doesn't work, copy and paste this URL into your browser:</p>
      <p style="color: #999; font-size: 11px; word-break: break-all;">${resetLink}</p>
    </div>
  `;

  try {
    await sendEmail(emailNormalized, "ZENFAZ - Reset your password", html);
  } catch (error) {
    console.error("Failed to send reset email:", error);
  }

  // 🔥 Always log the reset link to console for easy testing/debugging
  console.log("\n==================================================");
  console.log("🔑 PASSWORD RESET LINK GENERATED:");
  console.log(resetLink);
  console.log("==================================================\n");

  res.json({
    success: true,
    message: "If an account exists with this email, a reset link has been sent.",
  });
});

// ✅ RESET PASSWORD
export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    throw new AppError("Email, token, and new password are required", 400);
  }

  const emailNormalized = email.trim().toLowerCase();

  const user = await User.findOne({
    email: emailNormalized,
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Invalid or expired password reset token", 400);
  }

  // Hash new password
  user.password = await bcrypt.hash(newPassword, 10);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  res.json({
    success: true,
    message: "Password reset successful. You can now log in with your new password.",
  });
});
