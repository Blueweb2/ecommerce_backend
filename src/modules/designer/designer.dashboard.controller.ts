import { Request, Response, NextFunction } from "express";
import { Product } from "../product/product.model";
import { Order } from "../order/order.model";
import { PromoCode } from "../promo/promo.model";
import { AppError } from "../../utils/AppError";

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = (req as any).designer?.id;

    if (!designerId) {
      return next(new AppError("Not authenticated", 401));
    }

    const totalProducts = await Product.countDocuments({ designer: designerId });
    const activeCoupons = await PromoCode.countDocuments({ designer: designerId, isActive: true });

    // Find orders containing at least one item from this designer
    const orders = await Order.find({ "items.designer": designerId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    let totalRevenue = 0;
    let totalOrders = orders.length;

    const designerOrders = orders.map((order) => {
      const designerItems = order.items.filter(
        (item) => item.designer?.toString() === designerId
      );

      // Sum revenue for this designer from this order
      const orderRevenue = designerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      totalRevenue += orderRevenue;

      return {
        ...order.toObject(),
        items: designerItems,
        designerRevenue: orderRevenue,
      };
    });

    // Recent orders (top 10)
    const recentOrders = designerOrders.slice(0, 10);

    // Calculate top products
    const productSales: Record<string, { product: any; soldCount: number; revenue: number }> = {};
    
    designerOrders.forEach(order => {
      order.items.forEach(item => {
        const prodId = item.product.toString();
        if (!productSales[prodId]) {
          productSales[prodId] = {
            product: item.product,
            soldCount: 0,
            revenue: 0
          };
        }
        productSales[prodId].soldCount += item.quantity;
        productSales[prodId].revenue += (item.price * item.quantity);
      });
    });

    const topProductsIds = Object.keys(productSales)
      .sort((a, b) => productSales[b].soldCount - productSales[a].soldCount)
      .slice(0, 5);

    const topProductsDetails = await Product.find({ _id: { $in: topProductsIds } }).select("name images price slug stock");
    
    const topProducts = topProductsDetails.map(p => ({
      ...p.toObject(),
      soldCount: productSales[p._id.toString()].soldCount,
      revenue: productSales[p._id.toString()].revenue
    })).sort((a, b) => b.soldCount - a.soldCount);

    // Low stock products (stock < 10)
    const lowStockProducts = await Product.find({
      designer: designerId,
      stock: { $lt: 10, $gte: 0 }
    }).select("name images price stock").sort({ stock: 1 }).limit(10);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalRevenue,
        activeCoupons,
        recentOrders,
        topProducts,
        lowStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};
