import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import * as addressService from "./address.service";
import { CreateAddressDTO, UpdateAddressDTO } from "./address.types";

type AddressParams = {
  id?: string | string[];
};

const getAddressId = (id: string | string[] | undefined) => {
  if (Array.isArray(id)) return id[0];
  return id;
};

// ✅ GET
export const getMyAddressesHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError("Unauthorized", 401);

  const addresses = await addressService.getUserAddresses(userId);

  res.json({ data: addresses });
});

// ✅ CREATE
export const createAddressHandler = asyncHandler(async (
  req: Request<Record<string, never>, unknown, CreateAddressDTO>,
  res: Response
) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError("Unauthorized", 401);

  const address = await addressService.createAddress(userId, req.body);

  res.status(201).json({ data: address });
});

// ✅ UPDATE
export const updateAddressHandler = asyncHandler(async (
  req: Request<AddressParams, unknown, UpdateAddressDTO>,
  res: Response
) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError("Unauthorized", 401);

  const addressId = getAddressId(req.params.id);
  if (!addressId) throw new AppError("Address id is required", 400);

  const address = await addressService.updateAddress(
    userId,
    addressId,
    req.body
  );

  if (!address) throw new AppError("Address not found", 404);

  res.json({ data: address });
});

// ✅ DELETE
export const deleteAddressHandler = asyncHandler(async (
  req: Request<AddressParams>,
  res: Response
) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError("Unauthorized", 401);

  const addressId = getAddressId(req.params.id);
  if (!addressId) throw new AppError("Address id is required", 400);

  const deleted = await addressService.deleteAddress(
    userId,
    addressId
  );

  if (!deleted) throw new AppError("Address not found", 404);

  res.json({ message: "Address deleted successfully" });
});

// ✅ SET DEFAULT
export const setDefaultAddressHandler = asyncHandler(async (
  req: Request<AddressParams>,
  res: Response
) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError("Unauthorized", 401);

  const addressId = getAddressId(req.params.id);
  if (!addressId) throw new AppError("Address id is required", 400);

  const address = await addressService.setDefaultAddress(
    userId,
    addressId
  );

  if (!address) throw new AppError("Address not found", 404);

  res.json({ data: address });
});
