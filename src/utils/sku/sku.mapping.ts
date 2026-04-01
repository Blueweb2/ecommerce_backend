export const ATTRIBUTE_CODE_MAP: Record<string, Record<string, string>> = {
  color: {
    red: "RD",
    blue: "BL",
    black: "BK",
  },
  size: {
    small: "SM",
    medium: "MD",
    large: "LG",
  },
};

export const getAttributeCode = (attrName: string, attrValue: string) => {
  const map = ATTRIBUTE_CODE_MAP[attrName.toLowerCase()];
  if (!map) return attrValue.substring(0, 2).toUpperCase();

  return (
    map[attrValue.toLowerCase()] ||
    attrValue.substring(0, 2).toUpperCase()
  );
};