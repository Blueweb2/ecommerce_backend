import { Router } from "express";
import { getSignature, deleteImageHandler  } from "./cloudinary.controller";

const router = Router();

router.get("/signature", getSignature);
router.delete("/delete", deleteImageHandler);

export default router;