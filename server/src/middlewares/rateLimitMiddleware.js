import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { RateLimitKeyGenerators } from "../config/rateLimitConfig.js";

/**
 * Build our rate limiter (slowDown + rateLimit) from config profile.
 * Always returns a single middleware function.
 *
 * Usage:
 *   import { addRateLimiter } from "./middlewares/rateLimitMiddleware.js";
 *   import { LoginLimiter, EmailTargetLimiter } from "./config/rateLimitConfig.js";
 *
 *   router.post("/auth/login", addRateLimiter(LoginLimiter, EmailTargetLimiter));
 */

export function addRateLimiter(...limiterProfiles) {
  // Support passing profiles either as separate args or a single array
  if (limiterProfiles.length === 1 && Array.isArray(limiterProfiles[0])) {
    limiterProfiles = limiterProfiles[0];
  }
  // If multiple profiles exist recursively call addRateLimiter
  if (limiterProfiles.length > 1) {
    // Combine all limiters into one middleware
    const all = limiterProfiles.map((p) => addRateLimiter(p));
    return skipOptions(combineMiddleware(all));
  }

  const limiterProfile = limiterProfiles[0] || {};

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

  const config = { ...DEFAULTS, ...limiterProfile };

  // Use centralized key generators from config
  const keyGenerator =
    typeof config.keyGenerator === "function"
      ? config.keyGenerator
      : RateLimitKeyGenerators[config.key] || RateLimitKeyGenerators.ip;

  // ─────────── Slowdown ───────────
  // Use old-style increasing delay per request after delayAfter
  const speed = slowDown({
    windowMs: config.windowMs,
    delayAfter: config.delayAfter,
    delayMs: (used, req) => {
      const delayAfter = req.slowDown?.limit ?? config.delayAfter;
      return (used - delayAfter) * config.delayMs;
    },
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

  // Compose speed and limiter, and skip OPTIONS
  return skipOptions(combineMiddleware([speed, limiter]));
}

// ===== Helpers =====
function skipOptions(middleware) {
  return function (req, res, next) {
    if (req.method === "OPTIONS") return next();
    return middleware(req, res, next);
  };
}

// Helper: compose multiple middleware functions into one
function combineMiddleware(middlewares) {
  return function (req, res, next) {
    let i = 0;
    function runNext(err) {
      if (err) return next(err);
      if (i >= middlewares.length) return next();
      middlewares[i++](req, res, runNext);
    }
    runNext();
  };
}
