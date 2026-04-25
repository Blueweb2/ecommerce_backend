export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
}

export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin" | "superadmin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

// ✅ NEW
export interface LoginResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpDTO {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  accessToken: string;
}

export interface ResendOtpDTO {
  email: string;
}