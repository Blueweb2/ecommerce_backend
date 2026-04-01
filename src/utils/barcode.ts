import bwipjs from "bwip-js";

export const generateBarcode = async (sku: string) => {
  return await bwipjs.toBuffer({
    bcid: "code128",
    text: sku,
    scale: 3,
    height: 10,
    includetext: true,
  });
};