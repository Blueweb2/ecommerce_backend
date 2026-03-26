import { Request, Response } from "express";
import * as orderService from "./order.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/response";

export const createOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await orderService.createOrder((req as any).user.id, req.body);
    sendResponse(res, 201, "Order created successfully", order);
  }
);

export const getOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orderId = req.params.id as string;
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Check if user owns this order
    if (order.user.toString() !== (req as any).user.id && !["admin", "superadmin"].includes((req as any).user.role)) {
      throw new AppError("You do not have permission to view this order", 403);
    }

    sendResponse(res, 200, "Order fetched successfully", order);
  }
);

export const getUserOrdersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await orderService.getUserOrders((req as any).user.id, page, limit);
    sendResponse(res, 200, "User orders fetched", result);
  }
);

export const getAllOrdersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await orderService.getAllOrders(page, limit);
    sendResponse(res, 200, "All orders fetched", result);
  }
);

export const updateOrderStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orderId = req.params.id as string;
    const { status } = req.body;

    const order = await orderService.updateOrderStatus(orderId, status);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    sendResponse(res, 200, "Order status updated", order);
  }
);

export const deleteOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orderId = req.params.id as string;
    const order = await orderService.deleteOrder(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    sendResponse(res, 200, "Order deleted successfully");
  }
);
