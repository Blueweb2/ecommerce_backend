import { Router } from "express";
import {
  testShiprocketConnection,
  checkServiceability,
  getTrackingInfo,
  createShipment,
  assignAwb,
  generateLabel,
  cancelShipment,
  handleWebhook,
  getAllShipments,
} from "./delivery.controller";
import { protect, restrictTo, optionalProtect } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { serviceabilitySchema, assignAwbSchema } from "./delivery.validation";

const router = Router();

// Public & Health check routes
router.get("/test", testShiprocketConnection);
router.post("/serviceability", validate(serviceabilitySchema), checkServiceability);
router.post("/shipping-rate", validate(serviceabilitySchema), checkServiceability);
router.get("/track/:orderId", optionalProtect, getTrackingInfo);
router.post("/webhook", handleWebhook);

// Admin-only operations
router.use(protect);
router.use(restrictTo("admin"));

router.get("/shipments", getAllShipments);
router.post("/create/:orderId", createShipment);
router.post("/assign-awb/:orderId", validate(assignAwbSchema), assignAwb);
router.get("/label/:orderId", generateLabel);
router.post("/cancel/:orderId", cancelShipment);

export default router;