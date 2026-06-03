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
  requestReturnHandler,
  approveReturnHandler,
  rejectReturnHandler,
  markReturnReceivedHandler,
} from "./order.controller";

import { protect, optionalProtect, restrictTo } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "./order.schema";

const router = Router();

/* =========================
   🟢 CREATE ORDER
========================= */
router.post("/", optionalProtect, validate(createOrderSchema), createOrderHandler);

/* =========================
   🔵 USER ROUTES
========================= */
router.get("/my-orders", protect, getUserOrdersHandler);
router.post("/:id/retry-payment", protect, retryPaymentHandler);
router.post("/verify-payment", optionalProtect, verifyPaymentHandler);

router.put("/:id/cancel", protect, cancelOrderHandler);
router.put("/:id/pay", protect, markOrderPaidHandler);

router.post("/:id/refund", protect, requestRefundHandler);

router.post("/:id/return", protect, requestReturnHandler);

/* =========================
   🟣 ADMIN ROUTES
========================= */
router.get(
  "/admin/stats",
  protect,
  restrictTo("admin", "superadmin"),
  getAdminStatsHandler
);

router.get(
  "/",
  protect,
  restrictTo("admin", "superadmin"),
  getAllOrdersHandler
);

router.put(
  "/:id/status",
  protect,
  restrictTo("admin", "superadmin"),
  validate(updateOrderStatusSchema),
  updateOrderStatusHandler
);

router.put(
  "/:id/refund/approve",
  protect,
  restrictTo("admin", "superadmin"),
  approveRefundHandler
);

router.put(
  "/:id/refund/reject",
  protect,
  restrictTo("admin", "superadmin"),
  rejectRefundHandler
);

router.put(
  "/:id/return/approve",
  protect,
  restrictTo("admin", "superadmin"),
  approveReturnHandler
);

router.put(
  "/:id/return/reject",
  protect,
  restrictTo("admin", "superadmin"),
  rejectReturnHandler
);

router.put(
  "/:id/return/receive",
  protect,
  restrictTo("admin", "superadmin"),
  markReturnReceivedHandler
);

router.delete(
  "/:id",
  protect,
  restrictTo("admin", "superadmin"),
  deleteOrderHandler
);

/* =========================
   ⚠️ MUST BE LAST
========================= */
router.get("/:id", protect, getOrderHandler);

export default router;