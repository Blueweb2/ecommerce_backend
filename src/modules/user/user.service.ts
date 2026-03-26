import bcrypt from "bcryptjs";
import { User } from "./user.model";
import { CreateUserDTO, UpdateUserDTO, LoginDTO } from "./user.types";
import { AppError } from "../../utils/AppError";

/* =========================
   🔧 COMMON CREATE FUNCTION
========================= */
const createUser = async (
  data: CreateUserDTO,
  role: "user" | "admin" | "superadmin"
) => {
  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    throw new AppError("User already exists with this email", 409);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const user = await User.create({
    ...data,
    password: hashedPassword,
    role, // 🔒 controlled internally
  });

  return user;
};

/* =========================
   REGISTER / CREATE USERS
========================= */
export const registerUser = (data: CreateUserDTO) => {
  return createUser(data, "user");
};

export const createAdminUser = (data: CreateUserDTO) => {
  return createUser(data, "admin");
};

export const createSuperAdminUser = (data: CreateUserDTO) => {
  return createUser(data, "superadmin");
};

/* =========================
   LOGIN
========================= */
export const loginUser = async (data: LoginDTO) => {
  const user = await User.findOne({ email: data.email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(
    data.password,
    user.password
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  return user;
};

/* =========================
   GENERAL USER METHODS
========================= */
export const getUserById = async (id: string) => {
  return await User.findById(id).select("-password");
};

export const getUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};

export const updateUser = async (id: string, data: UpdateUserDTO) => {
  // Check email uniqueness if updating email
  if (data.email) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser && existingUser._id.toString() !== id) {
      throw new AppError("Email already in use", 409);
    }
  }

  const user = await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const deleteUser = async (id: string) => {
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return true;
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(password, hashedPassword);
};

/* =========================
   ROLE-BASED FETCH
========================= */
export const getCustomers = async () => {
  return User.find({ role: "user" }).select("-password");
};

export const getAdmins = async () => {
  return User.find({ role: "admin" }).select("-password");
};

/* =========================
   ADMIN MANAGEMENT
========================= */
export const getAdminById = async (id: string) => {
  const admin = await User.findById(id).select("-password");

  if (!admin || admin.role !== "admin") {
    throw new AppError("Admin not found", 404);
  }

  return admin;
};

export const updateAdmin = async (id: string, data: UpdateUserDTO) => {
  const admin = await User.findById(id);

  if (!admin || admin.role !== "admin") {
    throw new AppError("Admin not found", 404);
  }

  // Check email uniqueness if updating email
  if (data.email && data.email !== admin.email) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError("Email already in use", 409);
    }
  }

  // ✅ Only allowed fields
  admin.name = data.name ?? admin.name;
  admin.email = data.email ?? admin.email;
  admin.phone = data.phone ?? admin.phone;
  admin.isActive = data.isActive ?? admin.isActive;

  await admin.save();

  return admin;
};

export const deleteAdmin = async (id: string) => {
  const admin = await User.findById(id);

  if (!admin || admin.role !== "admin") {
    throw new AppError("Admin not found", 404);
  }

  await admin.deleteOne();

  return true;
};