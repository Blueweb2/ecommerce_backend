import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny, infer as zInfer } from "zod";

export const validate =
  <T extends ZodTypeAny>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData: zInfer<T> = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Validation Error",
          errors: error.issues.map((issue) => ({
            field: issue.path.map(String).join(".") || "root",
            message: issue.message,
          })),
        });
      }

      return next(error);
    }
  };
