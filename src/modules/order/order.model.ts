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

  paymentMethod: "cod" | "razorpay";

  paymentStatus: "pending" | "success" | "failed";

  refundStatus: "none" | "requested" | "approved" | "rejected"; // 🔥 ADD THIS

  isPaid: boolean;
  paidAt?: Date;

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
/* 🔹 Selected Options */
const selectedOptionSchema = new Schema(
  {
    fieldName: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

/* 🔹 Order Item */
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
    variantId: String,
    selectedOptions: {
      type: [selectedOptionSchema],
      default: [],
    },
  },
  { _id: false }
);

/* 🔹 Address */
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

/* 🔹 Order */
const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
      enum: ["cod", "razorpay"],
      required: true,
    },
    paymentStatus: {
  type: String,
  enum: ["pending", "success", "failed"],
  default: "pending",
  index: true, // ✅ good for queries
},
refundStatus: {
  type: String,
  enum: ["none", "requested", "approved", "rejected"],
  default: "none",
},

    isPaid: {
      type: Boolean,
      default: false,
      index: true, // ✅ added
    },

    paidAt: {
      type: Date,
    },

    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* 🔥 Indexes for performance */
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

/* 🔹 Virtual field */
orderSchema.virtual("itemCount").get(function () {
  return this.items.length;
});

export const Order = mongoose.model<IOrder>("Order", orderSchema);