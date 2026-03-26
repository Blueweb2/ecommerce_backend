import { Request, Response } from "express";
import * as cartService from "./cart.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/response";

export const getCartHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const cart = await cartService.getCart((req as any).user.id);
    sendResponse(res, 200, "Cart fetched successfully", cart);
  }
);

export const addToCartHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId, quantity } = req.body;
    const cart = await cartService.addToCart((req as any).user.id, productId, quantity);
    sendResponse(res, 200, "Item added to cart", cart);
  }
);

export const updateCartItemHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const { quantity } = req.body;

    const cart = await cartService.updateCartItem(
      (req as any).user.id,
      productId,
      quantity
    );

    sendResponse(res, 200, "Cart item updated", cart);
  }
);

export const removeFromCartHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const cart = await cartService.removeFromCart((req as any).user.id, productId);

    sendResponse(res, 200, "Item removed from cart", cart);
  }
);

export const clearCartHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const cart = await cartService.clearCart((req as any).user.id);
    sendResponse(res, 200, "Cart cleared", cart);
  }
);
