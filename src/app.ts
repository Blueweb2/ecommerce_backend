import express from "express";
import { env } from "./config/env";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes";

const app = express();

if (env.NODE_ENV === "production") {
  // Respect X-Forwarded-For when the API is deployed behind a reverse proxy.
  app.set("trust proxy", 1);
}

/* 🔹 CORS */
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

console.log(env.CLIENT_URL, "client url");

/* 🔥 IMPORTANT: RAW BODY FOR WEBHOOK */
app.use(
  "/api/webhooks/razorpay",
  express.raw({ type: "application/json" })
);

/* 🔹 JSON (AFTER webhook) */
app.use(express.json());

/* 🔹 Cookies */
app.use(cookieParser());

/* 🔹 Health Check */
app.get("/", (req, res) => {
  res.json({ message: "API running..." });
});

/* 🔹 Routes */
app.use("/api", routes);

/* 🔹 Error Handler (MUST BE LAST) */
app.use(errorHandler);

export default app;
