import express from "express";

import * as promoController from "./promo.controller";

import { protect, restrictTo } from "../../middlewares/auth";

import { validate } from "../../middlewares/validate";

import {
  createPromoSchema,
  updatePromoSchema,
  validatePromoSchema,
} from "./promo.schema";

const router = express.Router();

/* =========================
   PUBLIC ROUTES
========================= */

// Validate promo code
router.post(
  "/validate",
  validate(validatePromoSchema),
  promoController.validatePromoHandler
);

/* =========================
   ADMIN ROUTES
========================= */

router.use(
  protect,
  restrictTo("admin", "superadmin")
);

/* =========================
   CRUD
========================= */

router
  .route("/")
  .get(promoController.getAllPromosHandler)
  .post(
    validate(createPromoSchema),
    promoController.createPromoHandler
  );

router
  .route("/:id")
  .get(promoController.getPromoByIdHandler)
  .patch(
    validate(updatePromoSchema),
    promoController.updatePromoHandler
  )
  .delete(promoController.deletePromoHandler);

/* =========================
   SEND PROMO MAIL
========================= */

router.post(
  "/:id/send-mail",
  promoController.sendPromoMailHandler
);

export default router;