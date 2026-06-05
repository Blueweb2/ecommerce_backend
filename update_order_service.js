const fs = require('fs');

const path = 'e:/nextjsprojects/ecommerce/ecommerce-backend/src/modules/order/order.service.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!code.includes('import { sendEmail }')) {
  code = code.replace(
    'import * as promoService from "../promo/promo.service";',
    'import * as promoService from "../promo/promo.service";\nimport { sendEmail } from "../../utils/sendEmail";'
  );
}

// 2. Modify createOrder
const oldCreateOrder = `export const createOrder = async (userId: string, data: CreateOrderDTO) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const cart = await Cart.findOne({ user: userId }).session(session);

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    // ✅ Check stock + refresh GST from product slabs
    for (const item of cart.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product || product.stock < item.quantity) {
        throw new AppError("Insufficient stock for some items", 400);
      }

      item.gstPercentage = product.gstPercentage || 0;
      item.gstAmount = (item.price * item.gstPercentage) / 100;
    }

    const refreshedTotals = calculateCartTotals(cart.items);
    cart.totalPrice = refreshedTotals.totalPrice;
    cart.totalGstAmount = refreshedTotals.totalGstAmount;
    cart.totalQuantity = refreshedTotals.totalQuantity;
    await cart.save({ session });

    // ✅ Map items
    const orderItems = cart.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      gstPercentage: item.gstPercentage,
      gstAmount: item.gstAmount,
      variantId: item.variantId,
      selectedOptions: item.selectedOptions,
    }));

    // ✅ Apply Promo Code
    let discountAmount = 0;
    let promoData: any = undefined;

    if (data.promoCode) {
      const result = await promoService.validatePromoCode(data.promoCode, cart.totalPrice);
      discountAmount = result.discountAmount;
      promoData = {
        code: result.code,
        promoId: result.promoId,
      };
    }

    // 🔥 CREATE ORDER
    const order = await Order.create(
      [
        {
          user: userId,
          items: orderItems,
          totalPrice: cart.totalPrice,
          totalGstAmount: cart.totalGstAmount,
          shippingCharge: data.shippingCharge, // ✅ Added
          promoCode: promoData, // ✅ Added
          discountAmount: discountAmount, // ✅ Added
          grandTotal: Math.max(0, cart.totalPrice + cart.totalGstAmount + data.shippingCharge - discountAmount), // ✅ Updated
          totalQuantity: cart.totalQuantity,
           packagingOption: data.packagingOption,
          giftMessage: data.giftMessage,
          shippingAddress: data.shippingAddress,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          paymentStatus: "pending",
        },
      ],
      { session }
    );`;

const newCreateOrder = `export const createOrder = async (userId: string | null, data: CreateOrderDTO) => {
  if (!userId && (!data.isGuestOrder || !data.guestEmail)) {
    throw new AppError("Guest email is required for guest checkout", 400);
  }

  const session = await Order.startSession();
  session.startTransaction();

  try {
    let cartItems: any[] = [];
    let totalPrice = 0;
    let totalGstAmount = 0;
    let totalQuantity = 0;

    if (userId) {
      const cart = await Cart.findOne({ user: userId }).session(session);
      if (!cart || cart.items.length === 0) {
        throw new AppError("Cart is empty", 400);
      }
      cartItems = cart.items;
      totalPrice = cart.totalPrice;
      totalGstAmount = cart.totalGstAmount;
      totalQuantity = cart.totalQuantity;
    } else {
      if (!data.items || data.items.length === 0) {
        throw new AppError("Cart is empty", 400);
      }
      cartItems = data.items;
    }

    // ✅ Check stock + refresh GST from product slabs
    for (const item of cartItems) {
      const productId = item.product || item.productId;
      const product = await Product.findById(productId).session(session);

      if (!product || product.stock < item.quantity) {
        throw new AppError("Insufficient stock for some items", 400);
      }

      item.product = product._id;
      item.price = product.price;
      item.gstPercentage = product.gstPercentage || 0;
      item.gstAmount = (item.price * item.gstPercentage) / 100;
    }

    const refreshedTotals = calculateCartTotals(cartItems);
    totalPrice = refreshedTotals.totalPrice;
    totalGstAmount = refreshedTotals.totalGstAmount;
    totalQuantity = refreshedTotals.totalQuantity;

    if (userId) {
      await Cart.updateOne(
        { user: userId },
        { totalPrice, totalGstAmount, totalQuantity, items: cartItems },
        { session }
      );
    }

    // ✅ Map items
    const orderItems = cartItems.map((item: any) => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      gstPercentage: item.gstPercentage,
      gstAmount: item.gstAmount,
      variantId: item.variantId,
      selectedOptions: item.selectedOptions,
    }));

    // ✅ Apply Promo Code
    let discountAmount = 0;
    let promoData: any = undefined;

    if (data.promoCode) {
      const result = await promoService.validatePromoCode(data.promoCode, totalPrice);
      discountAmount = result.discountAmount;
      promoData = {
        code: result.code,
        promoId: result.promoId,
      };
    }

    // 🔥 CREATE ORDER
    const order = await Order.create(
      [
        {
          user: userId || undefined,
          isGuestOrder: data.isGuestOrder || false,
          guestEmail: data.guestEmail || null,
          items: orderItems,
          totalPrice: totalPrice,
          totalGstAmount: totalGstAmount,
          shippingCharge: data.shippingCharge,
          promoCode: promoData,
          discountAmount: discountAmount,
          grandTotal: Math.max(0, totalPrice + totalGstAmount + data.shippingCharge - discountAmount),
          totalQuantity: totalQuantity,
          packagingOption: data.packagingOption,
          giftMessage: data.giftMessage,
          shippingAddress: data.shippingAddress,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          paymentStatus: "pending",
        },
      ],
      { session }
    );`;

code = code.replace(oldCreateOrder, newCreateOrder);

// 3. Update COD cart clear
const oldCodClear = `      // clear cart
      await Cart.updateOne(
        { user: userId },
        { items: [], totalPrice: 0, totalGstAmount: 0, totalQuantity: 0 },
        { session }
      );`;

const newCodClear = `      // clear cart
      if (userId) {
        await Cart.updateOne(
          { user: userId },
          { items: [], totalPrice: 0, totalGstAmount: 0, totalQuantity: 0 },
          { session }
        );
      }
      
      // send email
      const email = createdOrder.isGuestOrder ? createdOrder.guestEmail : (await User.findById(userId))?.email;
      if (email) {
        await sendEmail(email, "ZENFAZ - Order Confirmation", \`<p>Your COD order has been placed. Order ID: \${createdOrder._id}</p>\`).catch(console.error);
      }`;

code = code.replace(oldCodClear, newCodClear);

// 4. Update Razorpay cart clear in markOrderPaid
const oldMarkPaidClear = `  // clear cart
  await Cart.updateOne(
    { user: order.user },
    { items: [], totalPrice: 0, totalGstAmount: 0, totalQuantity: 0 }
  );`;

const newMarkPaidClear = `  // clear cart
  if (order.user) {
    await Cart.updateOne(
      { user: order.user },
      { items: [], totalPrice: 0, totalGstAmount: 0, totalQuantity: 0 }
    );
  }
  
  // send email
  const email = order.isGuestOrder ? order.guestEmail : (await User.findById(order.user))?.email;
  if (email) {
    await sendEmail(email, "ZENFAZ - Payment Confirmation", \`<p>Your payment was successful. Order ID: \${order._id}</p>\`).catch(console.error);
  }`;

code = code.replace(oldMarkPaidClear, newMarkPaidClear);


// 5. Update updateOrderStatus for shipping updates
const oldUpdateStatus = `export const updateOrderStatus = async (id: string, status: string) => {
  return await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
};`;

const newUpdateStatus = `export const updateOrderStatus = async (id: string, status: string) => {
  const order = await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  
  if (order && (status === "shipped" || status === "delivered")) {
    const email = order.isGuestOrder ? order.guestEmail : (await User.findById(order.user))?.email;
    if (email) {
      await sendEmail(email, \`ZENFAZ - Order \${status}\`, \`<p>Your order \${order._id} has been \${status}.</p>\`).catch(console.error);
    }
  }
  
  return order;
};`;

code = code.replace(oldUpdateStatus, newUpdateStatus);

// 6. Update getAllOrders
const oldGetAllOrders = `export const getAllOrders = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find()
      .populate("user", "name email")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(),
  ]);`;

const newGetAllOrders = `export const getAllOrders = async (page: number = 1, limit: number = 10, customerType?: string) => {
  const skip = (page - 1) * limit;
  const filter: any = {};
  if (customerType === 'guest') filter.isGuestOrder = true;
  if (customerType === 'registered') filter.isGuestOrder = false;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);`;

code = code.replace(oldGetAllOrders, newGetAllOrders);

// 7. Update getAdminStats
const oldGetAdminStats = `  // 🔹 Total Users
  const totalUsers = await User.countDocuments();`;
  
const newGetAdminStats = `  // 🔹 Total Users
  const totalUsers = await User.countDocuments();
  
  // 🔹 Guest vs Registered Orders
  const guestOrders = await Order.countDocuments({ isGuestOrder: true });
  const registeredOrders = await Order.countDocuments({ isGuestOrder: false });
  const guestConversionRate = totalOrders > 0 ? (guestOrders / totalOrders) * 100 : 0;`;

code = code.replace(oldGetAdminStats, newGetAdminStats);

const oldGetAdminStatsReturn = `  return {
    totalOrders,
    totalRevenue,
    totalUsers,
    monthlyOrders,
    monthlyRevenue,
  };`;

const newGetAdminStatsReturn = `  return {
    totalOrders,
    totalRevenue,
    totalUsers,
    monthlyOrders,
    monthlyRevenue,
    guestOrders,
    registeredOrders,
    guestConversionRate,
  };`;

code = code.replace(oldGetAdminStatsReturn, newGetAdminStatsReturn);


fs.writeFileSync(path, code);
console.log("Updated order.service.ts successfully!");
