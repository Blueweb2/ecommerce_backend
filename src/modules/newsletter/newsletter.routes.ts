import { Router } from "express";
import * as newsletterController from "./newsletter.controller";

const router = Router();

router.post("/subscribe", newsletterController.subscribeHandler);
router.post("/send-offer", newsletterController.sendOfferHandler);
router.get("/stats", newsletterController.getStatsHandler);
router.get("/subscribers", newsletterController.getSubscribersHandler);

export default router;
