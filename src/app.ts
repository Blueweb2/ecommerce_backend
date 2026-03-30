import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes";
import { env } from "./config/env";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

console.log(env.CLIENT_URL, "client url")

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "API running..." });
});

app.use("/api", routes);

// MUST be last
app.use(errorHandler);

export default app;