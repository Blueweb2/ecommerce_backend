import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
 variantId?: string;

selectedOptions?: {
  fieldName: string;
  value: string;
}[];
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  totalQuantity: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: "card" | "paypal" | "stripe";
  isPaid: boolean;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
const selectedOptionSchema = new Schema(
  {
    fieldName: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    variantId: {
      type: String, // ✅ NEW
    },

    selectedOptions: {
      type: [selectedOptionSchema],
      default: [], // ✅ IMPORTANT
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "paypal", "stripe"],
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    notes: String,
  },
  { timestamps: true }
);

orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);
