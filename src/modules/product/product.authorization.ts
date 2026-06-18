import mongoose from "mongoose";
import { Designer } from "../designer/designer.model";
import { AppError } from "../../utils/AppError";

export type ProductActorRole = "admin" | "superadmin" | "designer";

export interface ProductActorContext {
  role: ProductActorRole;
  designerId?: string;
}

const ADMIN_PRODUCT_ROLES = new Set<ProductActorRole>([
  "admin",
  "superadmin",
]);

interface EnsureDesignerCanManageCategoryParams {
  actor?: ProductActorContext;
  categoryId?: string;
}

export const ensureDesignerCanManageCategory = async ({
  actor,
  categoryId,
}: EnsureDesignerCanManageCategoryParams) => {
  if (!actor || ADMIN_PRODUCT_ROLES.has(actor.role) || !categoryId) {
    return;
  }

  if (!actor.designerId) {
    throw new AppError("Designer authentication required", 401);
  }

  const normalizedCategoryId = categoryId.trim();

  if (!mongoose.Types.ObjectId.isValid(normalizedCategoryId)) {
    throw new AppError("Invalid category ID", 400);
  }

  const designer = await Designer.findById(actor.designerId)
    .select("categories")
    .lean();

  if (!designer) {
    throw new AppError("Designer not found", 404);
  }

  const hasAssignedCategory =
    Array.isArray(designer.categories) &&
    designer.categories.some(
      (assignedCategory) =>
        assignedCategory.toString() === normalizedCategoryId
    );

  if (!hasAssignedCategory) {
    throw new AppError("Category is not assigned to this designer", 403);
  }
};
