import { Router } from "express";
import { getSignature, deleteImageHandler  } from "./cloudinary.controller";
import { protect, restrictTo } from "../../middlewares/auth";

const router = Router();

router.get("/signature", protect, restrictTo("admin", "superadmin"), getSignature);
router.delete("/delete", deleteImageHandler);

export default router;