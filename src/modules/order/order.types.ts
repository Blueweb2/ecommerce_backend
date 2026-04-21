export interface CreateOrderDTO {
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: "cod" | "razorpay";
  notes?: string;
}

export interface UpdateOrderStatusDTO {
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
}

export interface OrderResponse {
  _id: string;
  user: string;
  items: OrderItemResponse[];
  totalPrice: number;
  totalQuantity: number;
  status: string;
  returnStatus?: string;
  returnReason?: string;
  returnRequestedAt?: string;
  shippingAddress: any;
  paymentMethod: string;
  isPaid: boolean;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SelectedOption {
  fieldName: string;
  value: string;
}

export interface RequestReturnDTO {
  reason: string;
}

export interface OrderItemResponse {
  product: string;

  quantity: number;
  price: number;

  variantId?: string; // ✅ NEW

  selectedOptions?: SelectedOption[]; // ✅ NEW
}