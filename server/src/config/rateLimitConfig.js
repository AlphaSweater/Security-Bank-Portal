import { ipKeyGenerator } from "express-rate-limit";

// ───────────────── Rate Limiting Profiles ─────────────────
// These presets aim for fair use under normal use
// while sharply degrading abusive patterns (rotation attacks, brute-force).
// Tune per route: use "GeneralLimiter" for most read APIs, stricter ones for auth and high-risk endpoints.

// ---------------- Keys & Key Generators ----------------
export const RateLimitKeys = Object.freeze({
  IP: "ip", // pure IP: good global backstop; careful with shared NATs
  EMAIL: "email", // single identity target (e.g., auth flows)
  EMAIL_IP: "emailIp", // identity+origin: best for login/register attempts
  SESSION_ID: "sessionId", // per-session: fair for authenticated traffic
  SESSION_ID_IP: "sessionIdIp", // session + origin: resists session token sharing
  USER_ID: "userId", // known user scope after auth
  USER_ID_IP: "userIdIp", // user + origin: defends against token reuse from new IPs
});

export const RateLimitKeyGenerators = {
  // Basic IP only
  ip: (req) => ipKeyGenerator(req),

  // Email only (for auth forms). Strong against rotating IP brute-force.
  email: (req) => {
    const email = (req.body?.email ?? "").toString().trim().toLowerCase();
    return email || ipKeyGenerator(req); // fallback to IP if empty
  },

  // Email or IP (legacy behavior) — prefer email when present, else IP
  emailOrIp: (req) => {
    const email = (req.body?.email ?? "").toString().trim().toLowerCase();
    return email || ipKeyGenerator(req);
  },

  // Email + IP composite (reduces false positives but weaker vs IP-rotation)
  emailIp: (req) => {
    const email = (req.body?.email ?? "").toString().trim().toLowerCase();
    return email ? `${email}|${ipKeyGenerator(req)}` : ipKeyGenerator(req);
  },

  // Session-based keys
  sessionId: (req) => req.sessionID || ipKeyGenerator(req),
  sessionIdIp: (req) =>
    req.sessionID
      ? `${req.sessionID}|${ipKeyGenerator(req)}`
      : ipKeyGenerator(req),

  // Authenticated user-based keys
  userId: (req) =>
    req.session?.userId ? String(req.session.userId) : ipKeyGenerator(req),
  userIdOrIp: (req) =>
    req.session?.userId ? String(req.session.userId) : ipKeyGenerator(req),
  userIdIp: (req) =>
    req.session?.userId
      ? `${req.session.userId}|${ipKeyGenerator(req)}`
      : ipKeyGenerator(req),

  // Backward compatibility alias (previously used in config)
  userOrIp: (req) => {
    const email = (req.body?.email ?? "").toString().trim().toLowerCase();
    return email || ipKeyGenerator(req);
  },
};

// ---------------- General API traffic ----------------
// 120 req / 15 min (~0.13 req/s), delay after 60th: +250ms/req up to 3s
// Balanced for authenticated dashboard/API usage. Keeps UX smooth while
// damping noisy or scripted clients. Session+IP reduces false sharing.
export const GeneralLimiter = Object.freeze({
  windowMs: 15 * 60 * 1000, // 15 min window
  max: 120, // ~8 req/min sustained; fine for SPA/API usage
  delayAfter: 60, // start slowing after normal bursty use
  delayMs: 250, // +250ms per request beyond delayAfter
  maxDelayMs: 3000, // cap latency penalty at 3s
  key: RateLimitKeys.SESSION_ID_IP,
  message: "Too many requests. Please slow down and try again.",
});

// ---------------- Global IP excess guard ----------------
// 80 req / 5 min (~0.27 req/s), delay after 40th: +300ms/req up to 10s
export const ExcessLimiter = Object.freeze({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 80, // global backstop per IP (protects shared NAT but blocks scraping)
  delayAfter: 40, // start slowing earlier for spikes
  delayMs: 300, // +300ms per overage
  maxDelayMs: 10000, // up to 10s when clearly abusive
  key: RateLimitKeys.IP,
  message: "Too many requests from this IP. Please slow down.",
});

// ---------------- Targeted account protection ----------------
// 5 req / 30 min (~0.0028 req/s), delay after 2nd: +1s/req up to 30s
export const EmailTargetLimiter = Object.freeze({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 5, // standard: 5 attempts per 30 min per identity
  delayAfter: 2, // protect quickly
  delayMs: 1000, // strong backoff to deter enumeration/brute force
  maxDelayMs: 30000, // up to 30s when abusive
  key: RateLimitKeys.EMAIL,
  message:
    "Too many attempts for this account. Please wait a while and try again.",
});

// ---------------- Auth flows ----------------
// 8 req / 15 min (~0.0089 req/s), delay after 2nd: +500ms/req up to 15s
export const AuthFlowLimiter = Object.freeze({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 8, // moderate envelope for auth flows
  delayAfter: 2, // get protective quickly
  delayMs: 500, // stronger backoff
  maxDelayMs: 15000,
  skipSuccessfulRequests: true, // only penalize failures
  key: RateLimitKeys.EMAIL_IP,
  message: "Too many attempts. Please wait a few minutes and try again.",
});

// ---------------- Login-specific ----------------
// 5 req / 2 hr (~0.00069 req/s), delay after 1st: +1s/req up to 20s
export const LoginLimiter = Object.freeze({
  windowMs: 120 * 60 * 1000, // 2 hours
  max: 5, // widely accepted control: 5 failed logins per 2 hours
  delayAfter: 1, // start slowing right after the first failure
  delayMs: 1000, // aggressive backoff to frustrate brute-force
  maxDelayMs: 20000,
  skipSuccessfulRequests: true, // success isn't penalized
  key: RateLimitKeys.EMAIL_IP,
  message: "Too many login attempts. Please wait before trying again.",
});

// ---------------- Password reset ----------------
// 5 req / 30 min (~0.0028 req/s), delay after 2nd: +5s/req up to 30s
export const PasswordResetLimiter = Object.freeze({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 5,
  delayAfter: 2,
  delayMs: 5000,
  maxDelayMs: 30000,
  skipSuccessfulRequests: true,
  key: RateLimitKeys.EMAIL,
  message: "Too many password reset attempts. Please wait and try again later.",
});
