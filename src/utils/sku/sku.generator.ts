import { Category } from "../../modules/category/category.model";
import { getNextSequence } from "./sku.counter";
import { getAttributeCode } from "./sku.mapping";

export const generateSmartSKU = async ({
  category,
  brand,
  attributes,
}: {
  category: string;
  brand?: string;
  attributes: Record<string, string>;
}) => {
  const categoryDoc = await Category.findById(category);

  const categoryCode =
    categoryDoc?.name?.replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 3)
      .toUpperCase() || "GEN";

  const brandCode = brand
    ? brand.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase()
    : "GEN";

  const attrCodes = Object.entries(attributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => getAttributeCode(key, value))
    .join("-");

  const prefix = `${categoryCode}-${brandCode}-${attrCodes}`;

  const sequence = await getNextSequence(prefix);
  const padded = String(sequence).padStart(4, "0");

  return `${prefix}-${padded}`;
};;