

export interface SelectedOption {
  fieldName: string;
  value: string;
}

export interface AddToCartDTO {
  productId: string;
  variantId?: string; // ✅ IMPORTANT

  quantity: number;
  

  selectedOptions?: SelectedOption[]; // ✅ replaces selectedSize
}

export interface UpdateCartItemDTO {
  quantity?: number;
  selectedOptions?: SelectedOption[];
}

export interface CartResponse {
  _id: string;
  user: string;

  items: CartItemResponse[];

  totalPrice: number;
  totalQuantity: number;

  updatedAt: string;
}

export interface CartItemResponse {
  _id: string;

  product: {
    _id: string;
    name: string;
    slug: string;
    image?: string;
  };

  variantId?: string;

  quantity: number;
  price: number;

  selectedOptions?: SelectedOption[];

  subtotal: number; // ✅ useful for UI
}
