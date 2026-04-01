import { Types } from "mongoose";

export const toStringId = (
  id: string | Types.ObjectId | undefined | null
): string => {
  if (!id) return "";

  return typeof id === "string" ? id : id.toString();
};