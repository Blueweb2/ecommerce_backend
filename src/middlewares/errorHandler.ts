import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    if (err.statusCode !== 401) {
      console.warn(`[AppError] ${err.statusCode}: ${err.message}`);
    }
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  console.error("Error:", err);

  // Handle Zod validation errors - check for 'issues' property (Zod v4)
  if (err && typeof err === "object" && "issues" in err && Array.isArray(err.issues)) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Validation Error",
      errors: err.issues.map((issue: any) => ({
        path: (issue.path as (string | number)[]).map(String).join(".") || "root",
        message: issue.message,
      })),
    });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid JSON format",
    });
  }

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: err.message || "Internal Server Error",
  });
};
