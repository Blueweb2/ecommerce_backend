import { Router } from "express";
import {
  createOrderHandler,
  getOrderHandler,
  getUserOrdersHandler,
  getAllOrdersHandler,
  updateOrderStatusHandler,
  deleteOrderHandler,
  cancelOrderHandler,
  markOrderPaidHandler,
  getAdminStatsHandler,
  verifyPaymentHandler,
  retryPaymentHandler,
  requestRefundHandler,
  approveRefundHandler,
  rejectRefundHandler,
} from "./order.controller";

import { protect, restrictTo } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "./order.schema";

const router = Router();

router.use(protect);

/* =========================
   🟢 CREATE ORDER
========================= */
router.post("/", validate(createOrderSchema), createOrderHandler);

/* =========================
   🔵 USER ROUTES
========================= */
router.get("/my-orders", getUserOrdersHandler);
router.post("/:id/retry-payment", retryPaymentHandler);
router.post("/verify-payment", verifyPaymentHandler);

router.put("/:id/cancel", cancelOrderHandler);
router.put("/:id/pay", markOrderPaidHandler);

router.post("/:id/refund", requestRefundHandler);

/* =========================
   🟣 ADMIN ROUTES
========================= */
router.get(
  "/admin/stats",
  restrictTo("admin", "superadmin"),
  getAdminStatsHandler
);

router.get(
  "/",
  restrictTo("admin", "superadmin"),
  getAllOrdersHandler
);

router.put(
  "/:id/status",
  restrictTo("admin", "superadmin"),
  validate(updateOrderStatusSchema),
  updateOrderStatusHandler
);

router.put(
  "/:id/refund/approve",
  restrictTo("admin", "superadmin"),
  approveRefundHandler
);

router.put(
  "/:id/refund/reject",
  restrictTo("admin", "superadmin"),
  rejectRefundHandler
);

router.delete(
  "/:id",
  restrictTo("admin", "superadmin"),
  deleteOrderHandler
);

/* =========================
   ⚠️ MUST BE LAST
========================= */
router.get("/:id", getOrderHandler);

export default router;