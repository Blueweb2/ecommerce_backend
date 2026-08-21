import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || "5000",
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI || "",

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "",

  CLIENT_URL: process.env.CLIENT_URL || "",
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED || "",
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || "",
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || "",
  SUBSCRIBE_RATE_LIMIT_WINDOW_MS:
    process.env.SUBSCRIBE_RATE_LIMIT_WINDOW_MS || "",
  SUBSCRIBE_RATE_LIMIT_MAX_REQUESTS:
    process.env.SUBSCRIBE_RATE_LIMIT_MAX_REQUESTS || "",

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET:
    process.env.RAZORPAY_WEBHOOK_SECRET || "",

  CLOUDINARY_CLOUD_NAME:
    process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || "",
  CLOUDINARY_API_KEY:
    process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY || "",
  CLOUDINARY_API_SECRET:
    process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET || "",

  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASS: process.env.EMAIL_PASS || "",

   RESEND_API_KEY:
    process.env.RESEND_API_KEY || "",

  SHIPROCKET_EMAIL: process.env.SHIPROCKET_EMAIL || "",
  SHIPROCKET_PASSWORD: process.env.SHIPROCKET_PASSWORD || "",
  SHIPROCKET_BASE_URL:
    process.env.SHIPROCKET_BASE_URL ||
    "https://apiv2.shiprocket.in/v1/external",
  SHIPROCKET_PICKUP_LOCATION:
    process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
  SHIPROCKET_PICKUP_PINCODE:
    process.env.SHIPROCKET_PICKUP_PINCODE || "679329",
  SHIPROCKET_WEBHOOK_SECRET:
    process.env.SHIPROCKET_WEBHOOK_SECRET || "",
};

