export const PRODUCT_SECTION_VALUES = [
  "featured",
  "best-seller",
  "new-arrival",
  "new-in",
  "top-rated",
] as const;

export type ProductSection = (typeof PRODUCT_SECTION_VALUES)[number];

// =======================
// IMAGE
// =======================
export interface ProductImageDTO {
  url: string;
  altText?: string;
  public_id?: string;
  isPrimary?: boolean;
}

// =======================
// ATTRIBUTE
// =======================
export interface ProductAttributeDTO {
  name: string;
  values: string[];
}

// =======================
// CUSTOM FIELD
// =======================
export interface CustomFieldDTO {
  name: string;
  type: "text" | "number" | "select";
  required?: boolean;
  options?: string[];
  unit?: string;
}

// =======================
// VARIANT
// =======================
export interface ProductVariantDTO {
  _id?: string; // ✅ add for updates

  attributes: Record<string, string>;

  price?: number;
  discountPrice?: number;
  isOnSale?: boolean;

  stock: number;
  sku?: string;

  images?: ProductImageDTO[];

  isActive?: boolean;
}

// =======================
// CREATE
// =======================
export interface CreateProductDTO {
  name: string;
  description: string;

  deliveryDetails?: string; // ✅ added
  keyFeatures?: string[];   // ✅ added

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
  gstPercentage?: number;
}

// =======================
// UPDATE
// =======================
export interface UpdateProductDTO extends Partial<CreateProductDTO> {}

// =======================
// RESPONSE
// =======================
export interface ProductResponse {
  _id: string;
  name: string;
  slug: string;
  sku: string;

  description: string;
  deliveryDetails?: string; // ✅ added
  keyFeatures: string[];    // ✅ added

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
  gstPercentage: number;
}