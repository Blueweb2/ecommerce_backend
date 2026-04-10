import { Cart } from "./cart.model";
import {Product} from "../product/product.model";
import { AppError } from "../../utils/AppError";


const normalizeOptions = (options: any[] = []) =>
  [...options].sort((a, b) =>
    a.fieldName.localeCompare(b.fieldName)
  );

const isSameItem = (item: any, incoming: any) => {
  return (
    item.product.toString() === incoming.productId &&
    (item.variantId ?? undefined) === (incoming.variantId ?? undefined) &&
    JSON.stringify(normalizeOptions(item.selectedOptions || [])) ===
      JSON.stringify(normalizeOptions(incoming.selectedOptions || []))
  );
};
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
  const cart = await Cart.findOne({ user: userId })
    .populate("items.product")
    .lean();

  return cart || { items: [], totalPrice: 0, totalQuantity: 0 };
};

export const addToCart = async (
  userId: string,
  dto: {
    productId: string;
    variantId?: string;
    quantity: number;
    selectedOptions?: { fieldName: string; value: string }[];
  }
) => {
  let cart = await Cart.findOne({ user: userId });

  const product = await Product.findById(dto.productId);
  if (!product) throw new AppError("Product not found", 404);

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  dto.selectedOptions = normalizeOptions(dto.selectedOptions || []);

  const existingItem = cart.items.find((item) =>
    isSameItem(item, dto)
  );

  if (existingItem) {
    const newQty = existingItem.quantity + dto.quantity;

    if (product.stock < newQty) {
      throw new AppError("Insufficient stock", 400);
    }

    existingItem.quantity = newQty;
  } else {
    if (product.stock < dto.quantity) {
      throw new AppError("Insufficient stock", 400);
    }

    cart.items.push({
      product: dto.productId,
      variantId: dto.variantId,
      quantity: dto.quantity,
      price: product.price,
      selectedOptions: dto.selectedOptions,
    } as any);
  }

  const totals = calculateCartTotals(cart.items);
  cart.totalPrice = totals.totalPrice;
  cart.totalQuantity = totals.totalQuantity;

  return await cart.save();
};

export const mergeCart = async (
  userId: string,
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    selectedOptions?: { fieldName: string; value: string }[];
  }[]
) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  for (const incoming of items) {
    const product = await Product.findById(incoming.productId);
    if (!product) continue;

    incoming.selectedOptions = normalizeOptions(
      incoming.selectedOptions || []
    );

    const existing = cart.items.find((item) =>
      isSameItem(item, incoming)
    );

    if (existing) {
      const newQty = existing.quantity + incoming.quantity;

      if (product.stock < newQty) continue;

      existing.quantity = newQty;
    } else {
      if (product.stock < incoming.quantity) continue;

      cart.items.push({
        product: incoming.productId,
        variantId: incoming.variantId,
        quantity: incoming.quantity,
        price: product.price,
        selectedOptions: incoming.selectedOptions,
      } as any);
    }
  }

  const totals = calculateCartTotals(cart.items);
  cart.totalPrice = totals.totalPrice;
  cart.totalQuantity = totals.totalQuantity;

  return await cart.save();
};

export const removeFromCart = async (userId: string, itemId: string) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) throw new AppError("Cart not found", 404);

  cart.items = cart.items.filter(
    (item) => item._id?.toString() !== itemId
  );

  const totals = calculateCartTotals(cart.items);
  cart.totalPrice = totals.totalPrice;
  cart.totalQuantity = totals.totalQuantity;

  return await cart.save();
};

export const updateCartItem = async (
  userId: string,
  itemId: string,
  quantity: number
) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) throw new AppError("Cart not found", 404);

  const item = cart.items.find(
    (item) => item._id?.toString() === itemId
  );

  if (!item) throw new AppError("Item not found", 404);

  const product = await Product.findById(item.product);
  if (!product || product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  item.quantity = quantity;

  const totals = calculateCartTotals(cart.items);
  cart.totalPrice = totals.totalPrice;
  cart.totalQuantity = totals.totalQuantity;

  return await cart.save();
};;

export const clearCart = async (userId: string) => {
  return await Cart.findOneAndUpdate(
    { user: userId },
    { items: [], totalPrice: 0, totalQuantity: 0 },
    { new: true }
  );
};
