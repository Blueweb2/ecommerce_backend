import { Order } from "./order.model";
import { Cart } from "../cart/cart.model";
import {Product} from "../product/product.model";
import { CreateOrderDTO } from "./order.types";
import { AppError } from "../../utils/AppError";
import { User } from "../user/user.model";

import Razorpay from "razorpay";
import { env } from "../../config/env";

let razorpay: Razorpay | null = null;

if (env.RAZORPAY_KEY_ID && env.RAZORPAY_SECRET) {
  razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_SECRET,
  });
}

export const createRetryPaymentOrder = async (orderId: string) => {
  if (!razorpay) {
    throw new AppError("Razorpay not configured", 500);
  }

  const order = await Order.findById(orderId);

  if (!order) throw new AppError("Order not found", 404);

  if (order.isPaid) {
    throw new AppError("Order already paid", 400);
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: order.totalPrice * 100,
    currency: "INR",
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: order.totalPrice,
  };
};

export const requestRefund = async (orderId: string, userId: string) => {
  const order = await Order.findById(orderId);

  if (!order) throw new AppError("Order not found", 404);

  if (order.user.toString() !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  if (!order.isPaid) {
    throw new AppError("Cannot refund unpaid order", 400);
  }

  order.refundStatus = "requested";
  return await order.save();
};

export const approveRefund = async (orderId: string) => {
  const order = await Order.findById(orderId);

  if (!order) throw new AppError("Order not found", 404);

  if (order.refundStatus !== "requested") {
    throw new AppError("Invalid refund state", 400);
  }

  order.refundStatus = "approved";

  return await order.save();
};

export const rejectRefund = async (orderId: string) => {
  const order = await Order.findById(orderId);

  if (!order) throw new AppError("Order not found", 404);

  order.refundStatus = "rejected";

  return await order.save();
};

export const requestReturn = async (orderId: string, userId: string, reason: string) => {
  const order = await Order.findById(orderId);

  if (!order) throw new AppError("Order not found", 404);

  if (order.user.toString() !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  if (order.status !== "delivered") {
    throw new AppError("Only delivered orders can be returned", 400);
  }

  if (order.returnStatus !== "none" && order.returnStatus !== "rejected") {
    throw new AppError("A return request already exists", 400);
  }

  order.returnStatus = "requested";
  order.returnReason = reason;
  order.returnRequestedAt = new Date();

  return await order.save();
};

export const approveReturn = async (orderId: string) => {
  const order = await Order.findById(orderId);

  if (!order) throw new AppError("Order not found", 404);

  if (order.returnStatus !== "requested") {
    throw new AppError("Return must be in requested state to approve", 400);
  }

  order.returnStatus = "approved";
  return await order.save();
};

export const rejectReturn = async (orderId: string) => {
  const order = await Order.findById(orderId);

  if (!order) throw new AppError("Order not found", 404);

  if (order.returnStatus !== "requested") {
    throw new AppError("Return must be in requested state to reject", 400);
  }

  order.returnStatus = "rejected";
  return await order.save();
};

export const markReturnReceived = async (orderId: string) => {
  const order = await Order.findById(orderId);

  if (!order) throw new AppError("Order not found", 404);

  if (order.returnStatus !== "approved") {
    throw new AppError("Return must be approved before it can be marked as received", 400);
  }

  order.returnStatus = "received";

  // When a returned item is received by the admin, we usually also trigger refund approval.
  if (order.isPaid) {
    order.refundStatus = "approved";
  }

  return await order.save();
};

export const markPaymentFailed = async (orderId: string) => {
  const order = await Order.findById(orderId);

  if (!order) throw new AppError("Order not found", 404);

  order.isPaid = false;
  order.paymentStatus = "failed";

  await order.save();

  return order;
};

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

    // ✅ Map items
    const orderItems = cart.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      variantId: item.variantId,
      selectedOptions: item.selectedOptions,
    }));

    // 🔥 CREATE ORDER
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
          paymentStatus: "pending",
        },
      ],
      { session }
    );

    const createdOrder = order[0];

    /* =========================
       🟢 COD FLOW
    ========================= */
    if (data.paymentMethod === "cod") {
      // reduce stock
      for (const item of cart.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { session }
        );
      }

      // clear cart
      await Cart.updateOne(
        { user: userId },
        { items: [], totalPrice: 0, totalQuantity: 0 },
        { session }
      );

      createdOrder.isPaid = true;
      createdOrder.paymentStatus = "success";
      createdOrder.paidAt = new Date();

      await createdOrder.save({ session });
    }

    /* =========================
       🔵 RAZORPAY FLOW
    ========================= */
    if (data.paymentMethod === "razorpay") {
      if (!razorpay) {
        throw new AppError("Razorpay not configured", 500);
      }

      const razorpayOrder = await razorpay.orders.create({
        amount: cart.totalPrice * 100,
        currency: "INR",
      });

      // attach razorpay order id
      (createdOrder as any).razorpayOrderId = razorpayOrder.id;
      await createdOrder.save({ session });

      await session.commitTransaction();
      session.endSession();

      return {
        ...createdOrder.toObject(),
        razorpayOrderId: razorpayOrder.id,
      };
    }

    /* =========================
       DEFAULT RETURN (COD)
    ========================= */
    await session.commitTransaction();
    session.endSession();

    return createdOrder;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const markOrderPaid = async (orderId: string) => {
  const order = await Order.findById(orderId);

  if (!order) throw new AppError("Order not found", 404);

  if (order.isPaid) return order;

  // ✅ mark paid
  order.isPaid = true;
  order.paidAt = new Date();
  await order.save();

  // ✅ reduce stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  // ✅ clear cart
  await Cart.updateOne(
    { user: order.user },
    { items: [], totalPrice: 0, totalQuantity: 0 }
  );

  return order;
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


export const getAdminStats = async () => {
  // 🔹 Total Orders
  const totalOrders = await Order.countDocuments();

  // 🔹 Total Revenue
  const revenueData = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalPrice" },
      },
    },
  ]);

  const totalRevenue = revenueData[0]?.total || 0;

  // 🔹 Total Users
  const totalUsers = await User.countDocuments();

  // 🔹 Monthly Orders
  const monthlyOrdersRaw = await Order.aggregate([
    {
      $group: {
        _id: { $month: "$createdAt" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  // 🔹 Monthly Revenue
  const monthlyRevenueRaw = await Order.aggregate([
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$totalPrice" },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const monthlyOrders = monthlyOrdersRaw.map((m) => ({
    month: monthNames[m._id - 1],
    orders: m.orders,
  }));

  const monthlyRevenue = monthlyRevenueRaw.map((m) => ({
    month: monthNames[m._id - 1],
    revenue: m.revenue,
  }));

  return {
    totalOrders,
    totalRevenue,
    totalUsers,
    monthlyOrders,
    monthlyRevenue,
  };
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
