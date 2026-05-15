import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async () => {
  try {
    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected");
  } catch (error: any) {
    console.error("MongoDB connection failed");
    console.error("Reason:", error?.message || error);

    if (error?.code === "ETIMEDOUT") {
      console.error(
        "Check MongoDB Atlas network access, local DNS, firewall, or ISP restrictions on port 27017."
      );
    }

    process.exit(1);
  }
};
