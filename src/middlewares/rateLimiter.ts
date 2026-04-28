import { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { env } from "../config/env";

const isProduction = env.NODE_ENV === "production";

const parseNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseBoolean = (value: string, fallback: boolean) => {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
};

const isRateLimitEnabled = parseBoolean(env.RATE_LIMIT_ENABLED, isProduction);

const defaultApiLimit = isProduction ? 100 : 10_000;
const defaultSubscribeLimit = isProduction ? 5 : 100;

const createJsonHandler = (message: string, windowMs: number) => {
  return (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    });
  };
};

const shouldSkipRateLimit = (method: string) => {
  return !isRateLimitEnabled || method === "OPTIONS";
};

const apiWindowMs = parseNumber(env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);

export const apiRateLimiter = rateLimit({
  windowMs: apiWindowMs,
  limit: parseNumber(env.RATE_LIMIT_MAX_REQUESTS, defaultApiLimit),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => shouldSkipRateLimit(req.method),
  handler: createJsonHandler(
    "Too many requests from this IP, please try again later",
    apiWindowMs
  ),
});

const subscribeWindowMs = parseNumber(
  env.SUBSCRIBE_RATE_LIMIT_WINDOW_MS,
  60 * 60 * 1000
);

export const subscribeRateLimiter = rateLimit({
  windowMs: subscribeWindowMs,
  limit: parseNumber(
    env.SUBSCRIBE_RATE_LIMIT_MAX_REQUESTS,
    defaultSubscribeLimit
  ),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => shouldSkipRateLimit(req.method),
  handler: createJsonHandler(
    "Too many subscription attempts, please try again later",
    subscribeWindowMs
  ),
});
