export interface ProductImageDTO {
  url: string;
  altText?: string;
  public_id?: string;
  isPrimary?: boolean;
}

export interface ProductVariantDTO {
  size?: string;
  color?: string;
  price?: number;
  discountPrice?: number;
  stock: number;
  sku?: string;
  images?: ProductImageDTO[];
  isActive?: boolean;
}

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string; // Category ObjectId
  sections?: string[]; // dynamic sections/tags
  brand?: string;
  stock: number;
  images?: ProductImageDTO[];
  variants?: ProductVariantDTO[];
  isPublished?: boolean;
  sku?: string; // Auto-generated if not provided
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}

export interface ProductResponse extends CreateProductDTO {
  _id: string;
  slug: string;
  sku: string;
  ratingsAverage: number;
  ratingsCount: number;
  createdAt: string;
  updatedAt: string;
}
