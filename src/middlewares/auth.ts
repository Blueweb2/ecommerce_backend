import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../config/jwt";
import { User } from "../modules/user/user.model";
import { AppError } from "../utils/AppError";

interface JwtPayload {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  // ✅ 1. Try Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // ✅ 2. Optional fallback (future-proof)
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError("No token provided", 401));
  }

  try {
    const decoded = verifyAccessToken(token) as JwtPayload;
    const user = await User.findById(decoded.id).select("_id role");

    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };

    next();
  } catch {
    return next(new AppError("Invalid or expired token", 401));
  }
};

export const restrictTo =
  (...roles: string[]) =>
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.user?.role || !roles.includes(req.user.role)) {
        return next(
          new AppError(
            "You do not have permission to perform this action",
            403
          )
        );
      }

      next();
    };
