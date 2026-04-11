import { Router } from "express";
import {
  getMyAddressesHandler,
  createAddressHandler,
  updateAddressHandler,
  deleteAddressHandler,
  setDefaultAddressHandler,
} from "./address.controller";
import { protect } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  createAddressSchema,
  updateAddressSchema,
} from "./address.schema";

const router = Router();

router.use(protect);

router.get("/", getMyAddressesHandler);
router.post("/", validate(createAddressSchema), createAddressHandler);
router.put("/:id", validate(updateAddressSchema), updateAddressHandler);
router.delete("/:id", deleteAddressHandler);
router.patch("/:id/default", setDefaultAddressHandler);

export default router;
