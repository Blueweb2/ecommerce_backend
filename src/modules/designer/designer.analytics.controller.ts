import { Request, Response, NextFunction } from "express";
import { Order } from "../order/order.model";
import { Product } from "../product/product.model";
import { AppError } from "../../utils/AppError";

export const getDesignerAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = (req as any).designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    // Get all orders containing products from this designer
    const orders = await Order.find({ "items.designer": designerId });

    // Arrays to store trends
    const revenueTrend: any[] = [];
    const ordersTrend: any[] = [];
    
    // For grouping by date
    const revenueByDate: Record<string, number> = {};
    const ordersByDate: Record<string, number> = {};
    
    const productSales: Record<string, { product: any; soldCount: number; revenue: number }> = {};
    const categorySales: Record<string, { category: any; soldCount: number; revenue: number }> = {};

    orders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split("T")[0];
      
      const designerItems = order.items.filter(
        item => item.designer?.toString() === designerId
      );

      if (designerItems.length > 0) {
        if (!ordersByDate[dateStr]) ordersByDate[dateStr] = 0;
        ordersByDate[dateStr] += 1;
      }

      designerItems.forEach(item => {
        const itemRevenue = item.price * item.quantity;
        
        if (!revenueByDate[dateStr]) revenueByDate[dateStr] = 0;
        revenueByDate[dateStr] += itemRevenue;

        const prodId = item.product.toString();
        if (!productSales[prodId]) {
          productSales[prodId] = {
            product: item.product,
            soldCount: 0,
            revenue: 0
          };
        }
        productSales[prodId].soldCount += item.quantity;
        productSales[prodId].revenue += itemRevenue;
      });
    });

    // Format trends
    Object.keys(revenueByDate).sort().forEach(date => {
      revenueTrend.push({ date, revenue: revenueByDate[date] });
    });

    Object.keys(ordersByDate).sort().forEach(date => {
      ordersTrend.push({ date, orders: ordersByDate[date] });
    });

    // Format top products
    const topProductsIds = Object.keys(productSales)
      .sort((a, b) => productSales[b].soldCount - productSales[a].soldCount)
      .slice(0, 10);

    const topProductsDetails = await Product.find({ _id: { $in: topProductsIds } }).select("name category");
    
    const topProducts = topProductsDetails.map(p => {
      const catId = p.category.toString();
      const stats = productSales[p._id.toString()];
      
      // Calculate category performance
      if (!categorySales[catId]) {
        categorySales[catId] = { category: catId, soldCount: 0, revenue: 0 };
      }
      categorySales[catId].soldCount += stats.soldCount;
      categorySales[catId].revenue += stats.revenue;

      return {
        _id: p._id,
        name: p.name,
        soldCount: stats.soldCount,
        revenue: stats.revenue
      };
    }).sort((a, b) => b.soldCount - a.soldCount);

    const categoryPerformance = Object.values(categorySales).sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      data: {
        revenueTrend,
        ordersTrend,
        topProducts,
        categoryPerformance
      },
    });
  } catch (error) {
    next(error);
  }
};
