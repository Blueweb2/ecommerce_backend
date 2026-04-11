import { Router } from "express";
import productRoutes from "../modules/product/product.routes";
import categoryRoutes from "../modules/category/category.routes";
import userRoutes from "../modules/user/user.routes";
import cartRoutes from "../modules/cart/cart.routes";
import orderRoutes from "../modules/order/order.routes";
import cloudinaryRoutes from "../modules/cloudinary/cloudinary.routes";
import authRoutes from "../modules/auth/auth.routes";
import addressRoutes from "../modules/address/address.routes";

const router = Router();

// Public routes
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);

// Protected routes
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/address", addressRoutes);

router.use("/cloudinary", cloudinaryRoutes);

export default router;
