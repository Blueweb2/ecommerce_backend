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
    .populate("items.product", "name slug image") // ✅ only needed fields
    .lean();

  // ✅ If no cart exists
  if (!cart) {
    return {
      items: [],
      totalPrice: 0,
      totalQuantity: 0,
    };
  }

  // ✅ Transform response (frontend-friendly)
  return {
    _id: cart._id,
    user: cart.user,
    totalPrice: cart.totalPrice,
    totalQuantity: cart.totalQuantity,

    items: cart.items.map((item: any) => ({
      _id: item._id,

      product: {
        _id: item.product?._id,
        name: item.product?.name,
        slug: item.product?.slug,
        image: item.product?.image,
      },

      variantId: item.variantId,
      quantity: item.quantity,
      price: item.price,
      selectedOptions: item.selectedOptions || [],

      subtotal: item.price * item.quantity, // ✅ UI ready
    })),
  };
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
  // 🔹 1. Get or create cart
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  if (!items.length) return cart;

  // 🔹 2. Fetch all products in ONE query (performance fix)
  const productIds = items.map((i) => i.productId);

  const products = await Product.find({
    _id: { $in: productIds },
  });

  const productMap = new Map(
    products.map((p) => [p._id.toString(), p])
  );

  // 🔹 3. Merge logic
  for (const incoming of items) {
    const product = productMap.get(incoming.productId);

    if (!product) continue; // skip invalid products

    // normalize options
    incoming.selectedOptions = normalizeOptions(
      incoming.selectedOptions || []
    );

    const existing = cart.items.find((item) =>
      isSameItem(item, incoming)
    );

    if (existing) {
      const newQty = existing.quantity + incoming.quantity;

      // ✅ FIX: do NOT skip → adjust quantity
      if (product.stock < newQty) {
        existing.quantity = product.stock;
      } else {
        existing.quantity = newQty;
      }
    } else {
      // ✅ FIX: do NOT skip → clamp quantity
      const finalQty =
        product.stock < incoming.quantity
          ? product.stock
          : incoming.quantity;

      if (finalQty <= 0) continue;

      cart.items.push({
        product: incoming.productId,
        variantId: incoming.variantId,
        quantity: finalQty,
        price: product.price, // ✅ always from DB
        selectedOptions: incoming.selectedOptions,
      } as any);
    }
  }

  // 🔹 4. Save (totals auto-calculated via pre-save middleware)
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
