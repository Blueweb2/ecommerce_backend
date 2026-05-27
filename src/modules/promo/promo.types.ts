export type PromoType = "percentage" | "fixed";

export interface IPromoCode {
  code: string;
  type: PromoType;
  value: number;
  minOrderValue: number;
  maxDiscount?: number; // For percentage type
  expiresAt: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromoDTO {
  code: string;
  type: PromoType;
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiresAt: string | Date;
  usageLimit: number;
  isActive?: boolean;
}

export interface UpdatePromoDTO extends Partial<CreatePromoDTO> {}
