import { Router } from "express";
import {
  createOrderHandler,
  getOrderHandler,
  getUserOrdersHandler,
  getAllOrdersHandler,
  updateOrderStatusHandler,
  deleteOrderHandler,
  cancelOrderHandler,
  markOrderPaidHandler
} from "./order.controller";

import { protect, restrictTo } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { createOrderSchema, updateOrderStatusSchema } from "./order.schema";

const router = Router();

router.use(protect); // All order routes require authentication

// Create order
router.post("/", validate(createOrderSchema), createOrderHandler);

// Get user's orders (must come BEFORE /:id route)
router.get("/my-orders", getUserOrdersHandler);

// Get single order by ID
router.get("/:id", getOrderHandler);

// Cancel order (user)

// Specific routes first
router.get("/my-orders", getUserOrdersHandler);
router.put("/:id/cancel", cancelOrderHandler);
router.put("/:id/pay", markOrderPaidHandler);

// Then generic
router.get("/:id", getOrderHandler);

// Admin routes
router.get("/", restrictTo("admin", "superadmin"), getAllOrdersHandler);
router.put("/:id/status", restrictTo("admin", "superadmin"), validate(updateOrderStatusSchema), updateOrderStatusHandler);
router.delete("/:id", restrictTo("admin", "superadmin"), deleteOrderHandler);



export default router;
