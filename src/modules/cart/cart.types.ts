export interface AddToCartDTO {
  productId: string;
  quantity: number;
  price: number;
  selectedSize?: string;
  customData?: {
    fieldName: string;
    value: string;
  }[];
}

export interface UpdateCartItemDTO {
  quantity: number;
}

export interface CartResponse {
  _id: string;
  user: string;
  items: CartItemResponse[];
  totalPrice: number;
  totalQuantity: number;
}

export interface CartItemResponse {
  product: string;
  quantity: number;
  price: number;
}
