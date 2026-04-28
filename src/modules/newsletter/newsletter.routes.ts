import { Router } from "express";
import { subscribeRateLimiter } from "../../middlewares/rateLimiter";
import * as newsletterController from "./newsletter.controller";

const router = Router();

router.post("/subscribe", subscribeRateLimiter, newsletterController.subscribeHandler);
router.post("/send-offer", newsletterController.sendOfferHandler);
router.get("/stats", newsletterController.getStatsHandler);
router.get("/subscribers", newsletterController.getSubscribersHandler);

export default router;
