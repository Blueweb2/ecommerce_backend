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

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
}
