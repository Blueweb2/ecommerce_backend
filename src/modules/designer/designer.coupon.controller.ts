import { Request, Response, NextFunction } from "express";
import { PromoCode } from "../promo/promo.model";
import { AppError } from "../../utils/AppError";

export const getDesignerCoupons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = (req as any).designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    const coupons = await PromoCode.find({ designer: designerId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

export const createDesignerCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = (req as any).designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    const couponData = { ...req.body, designer: designerId };

    const coupon = await PromoCode.create(couponData);

    res.status(201).json({
      success: true,
      data: coupon,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new AppError("Coupon code already exists", 400));
    }
    next(error);
  }
};

export const updateDesignerCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = (req as any).designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    let coupon = await PromoCode.findOne({ _id: req.params.id, designer: designerId });
    if (!coupon) return next(new AppError("Coupon not found or unauthorized", 404));

    const updateData = { ...req.body };
    delete updateData.designer;

    coupon = await PromoCode.findOneAndUpdate(
      { _id: req.params.id, designer: designerId },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: coupon,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new AppError("Coupon code already exists", 400));
    }
    next(error);
  }
};

export const deleteDesignerCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = (req as any).designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    const coupon = await PromoCode.findOneAndDelete({ _id: req.params.id, designer: designerId });
    if (!coupon) return next(new AppError("Coupon not found or unauthorized", 404));

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
