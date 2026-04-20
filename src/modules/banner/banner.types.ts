// ✅ Base Banner (used for create/update)
export interface IBanner {
  title?: string;
  image: {
    url: string;
    public_id: string;
  };
  link?: string;
  position: "hero" | "center" | "rightTop" | "rightBottom";
  order?: number;
  isActive?: boolean;
}

// ✅ Banner Document (from DB)
export interface IBannerDocument extends IBanner {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Grouped Banner Response (VERY IMPORTANT for frontend layout)
export interface IBannerGrouped {
  hero: IBannerDocument[];
  center: IBannerDocument | null;
  rightTop: IBannerDocument | null;
  rightBottom: IBannerDocument | null;
}

// ✅ API Response format
export interface IBannerResponse {
  success: boolean;
  data: IBannerGrouped;
}

// ✅ Create Banner Request (Admin)
export interface ICreateBannerRequest {
  title?: string;
  image: string;
  link?: string;
  position: "hero" | "center" | "rightTop" | "rightBottom";
  order?: number;
}

// ✅ Delete Banner Response
export interface IDeleteBannerResponse {
  success: boolean;
  message: string;
}