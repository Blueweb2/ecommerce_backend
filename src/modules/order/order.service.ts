import { Order } from "./order.model";
import { Cart } from "../cart/cart.model";
import {Product} from "../product/product.model";
import { CreateOrderDTO } from "./order.types";
import { AppError } from "../../utils/AppError";

export const createOrder = async (userId: string, data: CreateOrderDTO) => {
  // Get user's cart
  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  // Create order
  const order = await Order.create({
    user: userId,
    items: cart.items,
    totalPrice: cart.totalPrice,
    totalQuantity: cart.totalQuantity,
    shippingAddress: data.shippingAddress,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
  });

  // Reduce product stock
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(
      item.product,
      {
        $inc: { stock: -item.quantity },
      }
    );
  }

  // Clear cart
  await Cart.updateOne(
    { user: userId },
    { items: [], totalPrice: 0, totalQuantity: 0 }
  );

  return order;
};

export const getOrderById = async (id: string) => {
  return await Order.findById(id).populate("items.product");
};

export const getUserOrders = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: userId })
      .populate("items.product")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: userId }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const updateOrderStatus = async (id: string, status: string) => {
  return await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
};

export const getAllOrders = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find()
      .populate("user", "name email")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const deleteOrder = async (id: string) => {
  return await Order.findByIdAndDelete(id);
};
