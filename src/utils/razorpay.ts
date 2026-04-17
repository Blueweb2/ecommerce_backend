import crypto from "crypto";

export const verifyPayment = (
  razorpayOrderId: string,
  paymentId: string,
  signature: string
) => {
  const body = razorpayOrderId + "|" + paymentId;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET!)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
};