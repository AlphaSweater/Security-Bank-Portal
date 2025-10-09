// Configuration profiles for rate limiting strategies.

export const RateLimitKeys = Object.freeze({
  IP: "ip",
  USER_OR_IP: "userOrIp",
});

// General API traffic
export const GeneralRateLimiter = Object.freeze({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  delayAfter: 50, // start slowing after 50
  delayMs: 250, // +250ms per extra request
  maxDelayMs: 2000, // cap delay at 2s
  key: RateLimitKeys.IP, // throttle per IP
  message: "Too many requests, please try again later.",
});

// Auth flows (register, OTP verify, password reset, etc.)
export const AuthRateLimiter = Object.freeze({
  windowMs: 15 * 60 * 1000,
  max: 5,
  delayAfter: 2,
  delayMs: 2000,
  maxDelayMs: 10_000,
  skipSuccessfulRequests: true,
  key: RateLimitKeys.USER_OR_IP,
  message: "Too many attempts. Please wait a few minutes and try again.",
});

// Login-specific: key by username/email first to stop rotating IP brute-force
export const AuthLoginRateLimiter = Object.freeze({
  windowMs: 15 * 60 * 1000,
  max: 5,
  delayAfter: 2,
  delayMs: 2000,
  maxDelayMs: 10_000,
  skipSuccessfulRequests: true,
  key: RateLimitKeys.USER_OR_IP,
  message: "Too many login attempts. Please wait a few minutes and try again.",
});
