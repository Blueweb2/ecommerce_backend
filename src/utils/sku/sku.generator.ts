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
  const categoryCode = category.substring(0, 3).toUpperCase();
  const brandCode = brand
    ? brand.substring(0, 2).toUpperCase()
    : "GN";

  const attrCodes = Object.entries(attributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => getAttributeCode(key, value))
    .join("-");

  const prefix = `${categoryCode}-${brandCode}-${attrCodes}`;

  const sequence = await getNextSequence(prefix);
  const padded = String(sequence).padStart(4, "0");

  return `${prefix}-${padded}`;
};