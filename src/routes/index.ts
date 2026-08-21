import { Router } from "express";
import productRoutes from "../modules/product/product.routes";
import categoryRoutes from "../modules/category/category.routes";
import collectionRoutes from "../modules/collection/collection.routes";
import userRoutes from "../modules/user/user.routes";
import cartRoutes from "../modules/cart/cart.routes";
import orderRoutes from "../modules/order/order.routes";
import cloudinaryRoutes from "../modules/cloudinary/cloudinary.routes";
import authRoutes from "../modules/auth/auth.routes";
import addressRoutes from "../modules/address/address.routes";
import wishlistRoutes from "../modules/wishlist/wishlist.routes";
import webhookRoutes from "./webhook.routes";
import bannerRoutes from "../modules/banner/banner.routes";
import storyRoutes from "../modules/story/story.routes";
import storyAdminRoutes from "../modules/story/story.admin.routes";
import newsletterRoutes from "../modules/newsletter/newsletter.routes";
import designerRoutes from "../modules/designer/designer.routes";
import promoRoutes from "../modules/promo/promo.routes";
import deliveryRoutes from "../modules/delivery/delivery.routes";


const router = Router();
router.use("/webhooks", webhookRoutes);

// Public routes
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/collections", collectionRoutes);
router.use("/collection", collectionRoutes);
router.use("/stories", storyRoutes);
router.use("/admin/stories", storyAdminRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/designers", designerRoutes);
router.use("/promo", promoRoutes);

// Protected routes
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/address", addressRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/cloudinary", cloudinaryRoutes);
router.use("/banner", bannerRoutes);
router.use("/delivery", deliveryRoutes);
export default router;
