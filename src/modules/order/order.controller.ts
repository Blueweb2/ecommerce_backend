import { Request, Response } from "express";
import * as orderService from "./order.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/response";
import { verifyPayment } from "../../utils/razorpay";



export const retryPaymentHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    const data = await orderService.createRetryPaymentOrder(id);

    sendResponse(res, 200, "Retry payment order created", data);
  }
);

export const requestRefundHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const orderId = req.params.id;
    const userId = (req as any).user.id;

    const order = await orderService.requestRefund(orderId, userId);

    sendResponse(res, 200, "Refund requested", order);
  }
);

export const approveRefundHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const order = await orderService.approveRefund(req.params.id);

    sendResponse(res, 200, "Refund approved", order);
  }
);

export const rejectRefundHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const order = await orderService.rejectRefund(req.params.id);

    sendResponse(res, 200, "Refund rejected", order);
  }
);

export const requestReturnHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const orderId = req.params.id;
    const userId = (req as any).user.id;
    const { reason } = req.body;

    const order = await orderService.requestReturn(orderId, userId, reason);

    sendResponse(res, 200, "Return requested", order);
  }
);

export const approveReturnHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const order = await orderService.approveReturn(req.params.id);

    sendResponse(res, 200, "Return approved", order);
  }
);

export const rejectReturnHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const order = await orderService.rejectReturn(req.params.id);

    sendResponse(res, 200, "Return rejected", order);
  }
);

export const markReturnReceivedHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const order = await orderService.markReturnReceived(req.params.id);

    sendResponse(res, 200, "Return marked as received", order);
  }
);

export const createOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const order = await orderService.createOrder(userId, req.body);
    sendResponse(res, 201, "Order created successfully", order);
  }
);

export const cancelOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orderId = req.params.id as string;
    const userId = (req as any).user.id;

    const order = await orderService.cancelOrder(orderId, userId);

    sendResponse(res, 200, "Order cancelled successfully", order);
  }
);

export const markOrderPaidHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orderId = req.params.id as string;

    const order = await orderService.markOrderPaid(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    sendResponse(res, 200, "Order marked as paid", order);
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

export const getAdminStatsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await orderService.getAdminStats();

    sendResponse(res, 200, "Dashboard stats fetched", stats);
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


export const verifyPaymentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { razorpayOrderId, paymentId, signature, orderId } = req.body;

    const isValid = verifyPayment(
      razorpayOrderId,
      paymentId,
      signature
    );

    if (!isValid) {
      // 🔥 IMPORTANT: store failure
      await orderService.markPaymentFailed(orderId);

      throw new AppError("Payment verification failed", 400);
    }

    const order = await orderService.markOrderPaid(orderId);

    sendResponse(res, 200, "Payment verified successfully", order);
  }
);
