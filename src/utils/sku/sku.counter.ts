import { SKUCounter } from "@/models/skuCounter.model";

export const getNextSequence = async (prefix: string) => {
  const counter = await SKUCounter.findOneAndUpdate(
    { prefix },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  return counter.sequence;
};