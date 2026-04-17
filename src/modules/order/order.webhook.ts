import { Request, Response } from "express";
import crypto from "crypto";
import { Order } from "./order.model";
import { env } from "../../config/env";

/**
 * 🔐 Verify Razorpay Webhook Signature
 */
const verifyWebhookSignature = (body: Buffer, signature: string) => {
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  return expected === signature;
};

/**
 * 🔥 Razorpay Webhook Handler
 */
export const handleRazorpayWebhook = async (
  req: Request,
  res: Response
) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature) {
      return res.status(400).json({ message: "Missing signature" });
    }

    /* 🔐 Verify signature */
    const isValid = verifyWebhookSignature(req.body as Buffer, signature);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    /* 🔹 Parse event */
    const event = JSON.parse(req.body.toString());

    console.log("🔔 Webhook event:", event.event);

    /* =========================
       ✅ PAYMENT SUCCESS
    ========================== */
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      const order = await Order.findOne({
        razorpayOrderId: payment.order_id,
      });

      if (!order) {
        console.log("Order not found for webhook");
        return res.status(200).json({ status: "ok" });
      }

      if (!order.isPaid) {
        order.isPaid = true;
        order.paymentStatus = "success";
        order.paidAt = new Date();

        await order.save();

        console.log("✅ Payment marked as success:", order._id);
      }
    }

    /* =========================
       ❌ PAYMENT FAILED
    ========================== */
    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;

      const order = await Order.findOne({
        razorpayOrderId: payment.order_id,
      });

      if (!order) {
        console.log("Order not found for failed payment");
        return res.status(200).json({ status: "ok" });
      }

      order.paymentStatus = "failed";
      order.isPaid = false;

      await order.save();

      console.log("❌ Payment marked as failed:", order._id);
    }

    /* =========================
       ✅ RESPONSE
    ========================== */
    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);

    return res.status(500).json({
      message: "Webhook processing failed",
    });
  }
};