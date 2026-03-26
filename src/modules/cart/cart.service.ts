import { Cart } from "./cart.model";
import { Product } from "../product/product.model";
import { AppError } from "../../utils/AppError";

const calculateCartTotals = (items: any[]) => {
  return items.reduce(
    (acc, item) => ({
      totalPrice: acc.totalPrice + item.price * item.quantity,
      totalQuantity: acc.totalQuantity + item.quantity,
    }),
    { totalPrice: 0, totalQuantity: 0 }
  );
};

export const getCart = async (userId: string) => {
  return await Cart.findOne({ user: userId }).populate("items.product");
};

export const addToCart = async (userId: string, productId: string, quantity: number) => {
  let cart = await Cart.findOne({ user: userId });

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [
        {
          product: productId,
          quantity,
          price: product.price,
        },
      ],
    });
  } else {
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId as any,
        quantity,
        price: product.price,
      });
    }
  }

  const totals = calculateCartTotals(cart.items);
  cart.totalPrice = totals.totalPrice;
  cart.totalQuantity = totals.totalQuantity;

  return await cart.save();
};

export const removeFromCart = async (userId: string, productId: string) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  const totals = calculateCartTotals(cart.items);
  cart.totalPrice = totals.totalPrice;
  cart.totalQuantity = totals.totalQuantity;

  return await cart.save();
};

export const updateCartItem = async (
  userId: string,
  productId: string,
  quantity: number
) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const item = cart.items.find((item) => item.product.toString() === productId);

  if (!item) {
    throw new AppError("Item not found in cart", 404);
  }

  const product = await Product.findById(productId);
  if (!product || product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  item.quantity = quantity;

  const totals = calculateCartTotals(cart.items);
  cart.totalPrice = totals.totalPrice;
  cart.totalQuantity = totals.totalQuantity;

  return await cart.save();
};

export const clearCart = async (userId: string) => {
  return await Cart.findOneAndUpdate(
    { user: userId },
    { items: [], totalPrice: 0, totalQuantity: 0 },
    { new: true }
  );
};
