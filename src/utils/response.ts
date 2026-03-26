import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
}

export const sendResponse = <T,>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response => {
  return res.status(statusCode).json({
    success: statusCode < 400,
    statusCode,
    message,
    data,
  } as ApiResponse<T>);
};
