import { Router } from "express";
import express from "express";
import { handleRazorpayWebhook } from "./../modules/order/order.webhook";

const router = Router();

// 🔥 IMPORTANT: raw body middleware
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook
);

export default router;