import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../config/jwt";
import { User } from "../modules/user/user.model";
import { Designer } from "../modules/designer/designer.model";
import { AppError } from "../utils/AppError";

import { JwtPayload as JWTPayload } from "jsonwebtoken";

interface AuthPayload extends JWTPayload {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };

      designer?: {
        id: string;
      };
    }
  }
}
// interface JwtPayload {
//   id: string;
//   role: string;
// }

// declare global {
//   namespace Express {
//     interface Request {
//       user?: JwtPayload;
//       designer?: JwtPayload;
//     }
//   }
// }

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
    const decoded = verifyAccessToken(token) as AuthPayload;
    const user = await User.findById(decoded.id).select("_id role");

    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }

    console.log("AUTH USER:", {
      id: user._id.toString(),
      role: user.role,
    });

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };
    console.log("REQ.USER", req.user);
console.log("REQ.DESIGNER", req.designer);

    next();
  } catch {
    return next(new AppError("Invalid or expired token", 401));
  }
};



export const protectDesigner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Fallback cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError("No token provided", 401));
    }

    const decoded = verifyAccessToken(token) as AuthPayload;

    // Ensure token belongs to a designer
    if (decoded.role !== "designer") {
      return next(
        new AppError("Not authorized as a designer", 403)
      );
    }

    const designer = await Designer.findById(decoded.id).select(
      "_id isActive verificationStatus"
    );

    if (!designer) {
      return next(new AppError("Designer not found", 401));
    }

    if (!designer.isActive) {
      return next(
        new AppError(
          "Designer account has been deactivated",
          403
        )
      );
    }

    if (designer.verificationStatus === "rejected") {
      return next(
        new AppError(
          "Designer account has been rejected",
          403
        )
      );
    }

    req.designer = {
      id: designer._id.toString(),
    };

    next();
  } catch (error) {
    return next(
      new AppError("Invalid or expired access token", 401)
    );
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
      console.log("ROLE CHECK:", req.user);

      next();
    };

export const optionalProtect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token) as AuthPayload;
    const user = await User.findById(decoded.id).select("_id role");

    if (user) {
      req.user = {
        id: user._id.toString(),
        role: user.role,
      };
      console.log("OPTIONAL PROTECT USER:", req.user);
    }
    next();
  } catch {
    return next();
  }
};
