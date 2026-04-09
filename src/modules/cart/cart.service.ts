import { Cart } from "./cart.model";
import {Product} from "../product/product.model";
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
  return await Cart.findOne({ user: userId }).populate("items.product").lean();
};

export const addToCart = async (
  userId: string,
  productId: string,
  quantity: number,
  selectedSize?: string,
  customData?: { fieldName: string; value: string }[]
) => {
  let cart = await Cart.findOne({ user: userId });

  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found", 404);

  // ✅ Create cart if not exists
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // ✅ HANDLE CUSTOMIZABLE PRODUCTS ONLY
  if (product.customizable?.isCustomizable) {
    for (const field of product.customizable.fields) {
      if (field.required) {
        const exists = customData?.find(
          (f) => f.fieldName === field.name
        );

        if (!exists) {
          throw new AppError(`${field.name} is required`, 400);
        }
      }
    }
  } else {
    // ✅ NON-CUSTOM PRODUCT → ignore customization
    selectedSize = undefined;
    customData = undefined;
  }

  // ✅ SMART COMPARISON FUNCTION
  const isSameItem = (
    item: any,
    productId: string,
    selectedSize?: string,
    customData?: any[]
  ) => {
    if (item.product.toString() !== productId) return false;

    // ✅ If no customization → match only by product
    if (!selectedSize && !customData) return true;

    return (
      item.selectedSize === selectedSize &&
      JSON.stringify(item.customData || []) ===
        JSON.stringify(customData || [])
    );
  };

  // ✅ Find existing item
  const existingItem = cart.items.find((item) =>
    isSameItem(item, productId, selectedSize, customData)
  );

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;

    if (product.stock < newQty) {
      throw new AppError("Insufficient stock", 400);
    }

    existingItem.quantity = newQty;
  } else {
    if (product.stock < quantity) {
      throw new AppError("Insufficient stock", 400);
    }

    cart.items.push({
      product: productId as any,
      quantity,
      price: product.price,
      selectedSize,
      customData,
    });
  }

  // ✅ Recalculate totals
  const totals = calculateCartTotals(cart.items);
  cart.totalPrice = totals.totalPrice;
  cart.totalQuantity = totals.totalQuantity;

  return await cart.save();
};

export const mergeCart = async (userId: string, items: any[]) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  for (const incoming of items) {
    const product = await Product.findById(incoming.productId);
    if (!product) continue;

    const existing = cart.items.find(
      (i) => i.product.toString() === incoming.productId
    );

    if (existing) {
      const newQty = existing.quantity + incoming.quantity;

      if (product.stock < newQty) continue;

      existing.quantity = newQty;
    } else {
      if (product.stock < incoming.quantity) continue;

      cart.items.push({
        product: incoming.productId,
        quantity: incoming.quantity,
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
