import { Router } from "express";
import { getSignature } from "./cloudinary.controller";

const router = Router();

router.get("/signature", getSignature);
router.delete("/delete", deleteImageHandler);

export default router;