import mongoose, { Schema, Document } from "mongoose";

export interface ISelectedOption {
  fieldName: string;
  value: string;
}

export interface ICartItem {
  _id?: mongoose.Types.ObjectId; // ✅ needed

  product: mongoose.Types.ObjectId;
  variantId?: string;

  quantity: number;
  price: number;

  selectedOptions?: ISelectedOption[];
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;

  items: ICartItem[];

  totalPrice: number;
  totalQuantity: number;

  createdAt: Date;
  updatedAt: Date;
}
const selectedOptionSchema = new Schema<ISelectedOption>(
  {
    fieldName: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
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
      type: String, // ✅ added (for variants like size/color SKU)
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

    selectedOptions: [selectedOptionSchema], // ✅ unified structure
  },
  {
    _id: true, // ✅ IMPORTANT (allows update/remove by itemId)
  }
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ✅ one cart per user
      index: true,  // ✅ faster queries
    },

    items: {
      type: [cartItemSchema],
      default: [], // ✅ prevents undefined issues
    },

    totalPrice: {
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
    versionKey: false, // ✅ removes __v (cleaner API)
  }
);

export const Cart = mongoose.model<ICart>("Cart", cartSchema);
