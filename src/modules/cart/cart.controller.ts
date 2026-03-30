import { Request, Response } from "express";
import * as cartService from "./cart.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { sendResponse } from "../../utils/response";

export const getCartHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const cart = await cartService.getCart(userId);
    sendResponse(res, 200, "Cart fetched successfully", cart);
  }
);

export const addToCartHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const { productId, quantity } = req.body;
    const cart = await cartService.addToCart(userId, productId, quantity);
    sendResponse(res, 200, "Item added to cart", cart);
  }
);

export const updateCartItemHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const productId = req.params.productId as string;
    const { quantity } = req.body;

    const cart = await cartService.updateCartItem(
      userId,
      productId,
      quantity
    );

    sendResponse(res, 200, "Cart item updated", cart);
  }
);

export const removeFromCartHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const productId = req.params.productId as string;
    const cart = await cartService.removeFromCart(userId, productId);

    sendResponse(res, 200, "Item removed from cart", cart);
  }
);

export const clearCartHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const cart = await cartService.clearCart(userId);
    sendResponse(res, 200, "Cart cleared", cart);
  }
);

export const mergeCartHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const { items } = req.body;

  const cart = await cartService.mergeCart(userId, items);

  sendResponse(res, 200, "Cart merged successfully", cart);
});
