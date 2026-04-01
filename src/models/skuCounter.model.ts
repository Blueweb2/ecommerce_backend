import mongoose from "mongoose";

const skuCounterSchema = new mongoose.Schema({
  prefix: { type: String, required: true, unique: true },
  sequence: { type: Number, default: 0 },
});

export const SKUCounter = mongoose.model("SKUCounter", skuCounterSchema);