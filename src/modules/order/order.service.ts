import { Order } from "./order.model";
import { Cart } from "../cart/cart.model";
import {Product} from "../product/product.model";
import { CreateOrderDTO } from "./order.types";
import { AppError } from "../../utils/AppError";

export const createOrder = async (userId: string, data: CreateOrderDTO) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const cart = await Cart.findOne({ user: userId }).session(session);

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    // ✅ Check stock
    for (const item of cart.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product || product.stock < item.quantity) {
        throw new AppError("Insufficient stock for some items", 400);
      }
    }

    // ✅ Map items (with customization)
    const orderItems = cart.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      selectedSize: item.selectedSize,
      customData: item.customData,
    }));

    // ✅ Create order
    const order = await Order.create(
      [
        {
          user: userId,
          items: orderItems,
          totalPrice: cart.totalPrice,
          totalQuantity: cart.totalQuantity,
          shippingAddress: data.shippingAddress,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        },
      ],
      { session }
    );

    // ✅ Reduce stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // ✅ Clear cart
    await Cart.updateOne(
      { user: userId },
      { items: [], totalPrice: 0, totalQuantity: 0 },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return order[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const markOrderPaid = async (orderId: string) => {
  return await Order.findByIdAndUpdate(
    orderId,
    {
      isPaid: true,
      paidAt: new Date(),
    },
    { new: true }
  );
};

export const cancelOrder = async (orderId: string, userId: string) => {
  const order = await Order.findById(orderId);

  if (!order) throw new AppError("Order not found", 404);

  // ✅ Only owner can cancel
  if (order.user.toString() !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  // ✅ Prevent cancelling delivered orders
  if (order.status === "delivered") {
    throw new AppError("Cannot cancel delivered order", 400);
  }

  // ✅ Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  order.status = "cancelled";
  return await order.save();
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
