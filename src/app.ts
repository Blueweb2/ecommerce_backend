import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API running..." });
});

app.use("/api", routes);

// MUST be last
app.use(errorHandler);

export default app;