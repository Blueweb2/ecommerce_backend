import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/response";
import * as newsletterService from "./newsletter.service";
import { AppError } from "../../utils/AppError";

export const subscribeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const subscriber = await newsletterService.subscribe(email);

    sendResponse(res, 201, "Subscribed successfully!", subscriber);
  }
);

export const sendOfferHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { subject, content } = req.body;

    if (!subject || !content) {
      throw new AppError("Subject and content are required", 400);
    }

    const result = await newsletterService.sendOfferToSubscribers(subject, content);

    sendResponse(res, 200, `Successfully sent emails to ${result.total} subscribers!`, result);
  }
);

export const getStatsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await newsletterService.getNewsletterStats();
    sendResponse(res, 200, "Stats fetched successfully", stats);
  }
);

export const getSubscribersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string) || "";

    const data = await newsletterService.getAllSubscribers(page, limit, search);

    sendResponse(res, 200, "Subscribers fetched successfully", data);
  }
);
