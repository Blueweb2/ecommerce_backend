import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      // Zod v4 uses 'issues' property instead of 'errors'
      if (error && typeof error === "object" && "issues" in error) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Validation Error",
          errors: error.issues.map((issue: any) => ({
            field: (issue.path as (string | number)[]).map(String).join(".") || "root",
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
