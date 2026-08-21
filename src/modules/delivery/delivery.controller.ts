import { Request, Response, NextFunction } from "express";
import * as deliveryService from "./delivery.service";
import shiprocketService from "../../services/shiprocket.service";
import { Order } from "../order/order.model";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";

export const testShiprocketConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = await shiprocketService.getToken();

    res.status(200).json({
      success: true,
      message: "Shiprocket connected successfully",
      tokenReceived: Boolean(token),
    });
  } catch (error: any) {
    next(error);
  }
};

export const checkServiceability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { deliveryPincode, weight, cod } = req.body;
    const result = await deliveryService.checkPincodeServiceability({
      deliveryPincode,
      weight,
      cod,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrackingInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = String(req.params.orderId);

    // Check permissions if user is requesting
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (req.user && req.user.role !== "admin" && order.user?.toString() !== req.user.id) {
      throw new AppError("Unauthorized to view tracking for this order", 403);
    }

    const tracking = await deliveryService.getOrderTrackingDetails(orderId);

    res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    next(error);
  }
};

export const createShipment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = String(req.params.orderId);
    const updatedOrder = await deliveryService.createShiprocketOrderForOrder(orderId);

    res.status(200).json({
      success: true,
      message: "Shipment created successfully",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const assignAwb = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = String(req.params.orderId);
    const { courierId } = req.body || {};

    const updatedOrder = await deliveryService.assignAwbToOrder(orderId, courierId);

    res.status(200).json({
      success: true,
      message: "AWB assigned successfully",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const generateLabel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = String(req.params.orderId);
    const result = await deliveryService.generateOrderShippingLabel(orderId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelShipment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = String(req.params.orderId);
    const updatedOrder = await deliveryService.cancelOrderShipment(orderId);

    res.status(200).json({
      success: true,
      message: "Shipment cancelled successfully",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Optional secret verification header check
    const secretHeader = req.headers["x-api-key"];

if (
  env.SHIPROCKET_WEBHOOK_SECRET &&
  secretHeader !== env.SHIPROCKET_WEBHOOK_SECRET
) {
  return res.status(401).json({
    success: false,
    message: "Invalid webhook token",
  });
}

    const payload = req.body;
    console.log("[Shiprocket Webhook Payload Received]:", JSON.stringify(payload));

    await deliveryService.processShiprocketWebhookPayload(payload);

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error: any) {
    console.error("[Shiprocket Webhook Error]:", error.message);
    res.status(200).json({
      success: false,
      message: "Webhook handled with warning",
    });
  }
};

export const getAllShipments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { "deliveryDetails.shipmentId": { $exists: true, $ne: null } };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        shipments: orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};