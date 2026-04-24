export const PRODUCT_SECTION_VALUES = [
  "featured",
  "best-seller",
  "new-arrival",
  "new-in",
  "top-rated",
] as const;

export type ProductSection = (typeof PRODUCT_SECTION_VALUES)[number];

export interface ProductImageDTO {
  url: string;
  altText?: string;
  public_id?: string;
  isPrimary?: boolean;
}

export interface ProductAttributeDTO {
  name: string;
  values: string[];
}

export interface CustomFieldDTO {
  name: string;
  type: "text" | "number" | "select";
  required?: boolean;
  options?: string[];
  unit?: string;
}

export interface ProductVariantDTO {
  attributes: Record<string, string>;

  price?: number;
  discountPrice?: number;
  isOnSale?: boolean;
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

  category: string;
  sections?: ProductSection[];

  brand?: string;
  sku?: string;

  stock: number;

  images?: ProductImageDTO[];

  attributes?: ProductAttributeDTO[];

  variants?: ProductVariantDTO[];
  customizable?: {
    isCustomizable: boolean;
    fields?: CustomFieldDTO[];
  };

  isPublished?: boolean;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> { }

export interface ProductResponse {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;

  price: number;
  discountPrice?: number;
  isOnSale?: boolean;

  category: string;
  sections: ProductSection[];

  brand?: string;

  stock: number;

  images: ProductImageDTO[];

  attributes: ProductAttributeDTO[];
  variants: ProductVariantDTO[];

  customizable?: {
    isCustomizable: boolean;
    fields?: CustomFieldDTO[];
  };

  isPublished: boolean;

  ratingsAverage: number;
  ratingsCount: number;

  createdAt: string;
  updatedAt: string;
}
