import { Request, Response } from "express";
import * as promoService from "./promo.service";
import { asyncHandler } from "../../utils/asyncHandler";

export const createPromoHandler = asyncHandler(async (req: Request, res: Response) => {
  const promo = await promoService.createPromo(req.body);
  res.status(201).json({
    success: true,
    data: promo,
  });
});

export const updatePromoHandler = asyncHandler(async (req: Request, res: Response) => {
  const promo = await promoService.updatePromo(req.params.id as string, req.body);
  res.status(200).json({
    success: true,
    data: promo,
  });
});

export const getAllPromosHandler = asyncHandler(async (req: Request, res: Response) => {
  const promos = await promoService.getAllPromos();
  res.status(200).json({
    success: true,
    data: promos,
  });
});

export const getPromoByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const promo = await promoService.getPromoById(req.params.id as string);
  res.status(200).json({
    success: true,
    data: promo,
  });
});

export const deletePromoHandler = asyncHandler(async (req: Request, res: Response) => {
  await promoService.deletePromo(req.params.id as string);
  res.status(204).json({
    success: true,
    data: null,
  });
});

export const validatePromoHandler = asyncHandler(async (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  const result = await promoService.validatePromoCode(code, subtotal);
  res.status(200).json({
    success: true,
    data: result,
  });
});



export const sendPromoMailHandler = asyncHandler(async (req: Request, res: Response) => {
  await promoService.sendPromoMail(req.params.id as string);

  res.status(200).json({
    success: true,
    message: "Promo mails sent",
  });
});