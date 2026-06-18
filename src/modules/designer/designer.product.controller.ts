import { Request, Response, NextFunction } from "express";
import { Product } from "../product/product.model";
import { AppError } from "../../utils/AppError";
import { ProductActorContext } from "../product/product.authorization";
import * as productService from "../product/product.service";

const getDesignerProductActor = (req: Request): ProductActorContext => {
  const designerId = req.designer?.id;

  if (!designerId) {
    throw new AppError("Not authenticated", 401);
  }

  return {
    role: "designer",
    designerId,
  };
};

export const getDesignerProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = req.designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    const products = await Product.find({ designer: designerId }).sort({ createdAt: -1 }).populate("category").populate("designer");

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getDesignerProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = req.designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    const product = await Product.findOne({ _id: req.params.id, designer: designerId });
    if (!product) return next(new AppError("Product not found or unauthorized", 404));

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const createDesignerProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = req.designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    // Force designer ID to current logged-in designer from req.designer.id
    const productData = { ...req.body, designer: designerId };

    const product = await productService.createProduct(
      productData,
      getDesignerProductActor(req)
    );

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDesignerProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = req.designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    let product = await Product.findOne({ _id: req.params.id, designer: designerId });
    if (!product) return next(new AppError("Product not found or unauthorized", 404));

    // Prevent re-assigning to another designer
    const updateData = { ...req.body };
    delete updateData.designer;

    const updatedProduct = await productService.updateProduct(
      req.params.id as string,
      updateData,
      getDesignerProductActor(req)
    );

    res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDesignerProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const designerId = req.designer?.id;
    if (!designerId) return next(new AppError("Not authenticated", 401));

    const product = await Product.findOneAndDelete({ _id: req.params.id, designer: designerId });
    if (!product) return next(new AppError("Product not found or unauthorized", 404));

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
