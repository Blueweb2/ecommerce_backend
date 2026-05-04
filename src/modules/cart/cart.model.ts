import mongoose, { Schema, Document } from "mongoose";

export interface ISelectedOption {
  fieldName: string;
  value: string;
}

export interface ICartItem {
  _id?: mongoose.Types.ObjectId;

  product: mongoose.Types.ObjectId;
  variantId?: string;

  quantity: number;
  price: number;
  gstPercentage: number;
  gstAmount: number;

  selectedOptions?: ISelectedOption[];
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;

  items: ICartItem[];

  totalPrice: number;
  totalGstAmount: number;
  totalQuantity: number;

  createdAt: Date;
  updatedAt: Date;
}

const selectedOptionSchema = new Schema<ISelectedOption>(
  {
    fieldName: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const cartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variantId: {
      type: String,
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

    gstPercentage: {
      type: Number,
      default: 0,
    },

    gstAmount: {
      type: Number,
      default: 0,
    },

    selectedOptions: [selectedOptionSchema],
  },
  {
    _id: true,
  }
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },

    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalGstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


cartSchema.pre("save", function () {
  const cart = this as any;

  const totals = cart.items.reduce(
    (acc: any, item: any) => {
      const itemGst = (item.price * (item.gstPercentage || 0)) / 100;
      item.gstAmount = itemGst * item.quantity;
      
      return {
        totalPrice: acc.totalPrice + item.price * item.quantity,
        totalGstAmount: acc.totalGstAmount + item.gstAmount,
        totalQuantity: acc.totalQuantity + item.quantity,
      };
    },
    { totalPrice: 0, totalGstAmount: 0, totalQuantity: 0 }
  );

  cart.totalPrice = totals.totalPrice;
  cart.totalGstAmount = totals.totalGstAmount;
  cart.totalQuantity = totals.totalQuantity;
});

export const Cart = mongoose.model<ICart>("Cart", cartSchema);