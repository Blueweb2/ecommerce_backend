import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../config/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}


export const protect = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(new AppError("No token provided", 401));
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return next(new AppError("Invalid or expired token", 401));
  }
};

export const restrictTo =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };