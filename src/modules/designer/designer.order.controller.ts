import { Request, Response, NextFunction } from "express";
import { Order } from "../order/order.model";
import { AppError } from "../../utils/AppError";

export const getDesignerOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = (req as any).designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    const orders = await Order.find({ "items.designer": designerId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const filteredOrders = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        item => item.designer?.toString() === designerId
      );
      return orderObj;
    });

    res.status(200).json({
      success: true,
      data: filteredOrders,
    });
  } catch (error) {
    next(error);
  }
};

export const getDesignerOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = (req as any).designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    const order = await Order.findOne({ 
      _id: req.params.id,
      "items.designer": designerId 
    }).populate("user", "name email phone");

    if (!order) {
      return next(new AppError("Order not found or unauthorized", 404));
    }

    const orderObj = order.toObject();
    orderObj.items = orderObj.items.filter(
      item => item.designer?.toString() === designerId
    );

    res.status(200).json({
      success: true,
      data: orderObj,
    });
  } catch (error) {
    next(error);
  }
};
