import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

/**
 * Build our rate limiter (slowDown + rateLimit) from config profile.
 *
 * Usage:
 *   import { addRateLimiter } from "./middlewares/rateLimitMiddleware.js";
 *   import { AuthRateLimiter } from "./config/rateLimitConfig.js";
 *
 *   router.post("/auth/login", ...addRateLimiter(AuthRateLimiter));
 */
export function addRateLimiter(profile = {}) {
  // ─────────── Defaults ───────────
  const DEFAULTS = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    delayAfter: 50,
    delayMs: 250,
    maxDelayMs: 2000,
    message: "Too many requests, please try again later.",
    key: "ip",
    skipSuccessfulRequests: false,
  };

  const config = { ...DEFAULTS, ...profile };

  // ─────────── Key strategies ───────────
  const keyStrategies = {
    ip: (req) => req.ip,
    userOrIp: (req) => {
      const b = req.body ?? {};
      const login = (b.email || "").toString().trim().toLowerCase();
      return login || req.ip;
    },
  };

  const keyGenerator =
    typeof config.keyGenerator === "function"
      ? config.keyGenerator
      : keyStrategies[config.key] || keyStrategies.ip;

  // ─────────── Slowdown ───────────
  const speed = slowDown({
    windowMs: config.windowMs,
    delayAfter: config.delayAfter,
    delayMs: config.delayMs,
    maxDelayMs: config.maxDelayMs,
    keyGenerator,
    skip: config.skip,
    skipSuccessfulRequests: config.skipSuccessfulRequests,
  });

  // ─────────── Limiter (hard cap) ───────────
  const limiter = rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    skip: config.skip,
    skipSuccessfulRequests: config.skipSuccessfulRequests,
    handler:
      typeof config.handler === "function"
        ? config.handler
        : (req, res) =>
            res.status(429).json({
              message: config.message,
            }),
  });

  return [speed, limiter];
}
