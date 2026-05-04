import crypto from "crypto";
import { env } from "../config/env";

export const verifyPayment = (
  razorpayOrderId: string,
  paymentId: string,
  signature: string
) => {
  const body = razorpayOrderId + "|" + paymentId;

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
};