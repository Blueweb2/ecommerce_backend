export const normalize = (value: string): string => {
  return value.trim().toLowerCase();
};

export const normalizeKey = (key: string): string => {
  const k = key.trim().toLowerCase();
  if (k === "color" || k === "colour") return "color";
  return k;
};

export const getAttributeValueCaseInsensitive = (
  attributes: Record<string, string | undefined> | undefined,
  key: string
): string | undefined => {
  if (!attributes) return undefined;
  const normalizedTarget = normalizeKey(key);
  for (const [k, v] of Object.entries(attributes)) {
    if (normalizeKey(k) === normalizedTarget) {
      return v;
    }
  }
  return undefined;
};
