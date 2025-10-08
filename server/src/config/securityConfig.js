import helmet from "helmet";
import cors from "cors";
import csurf from "csurf";
import { csrfCookieOptions } from "#config/cookies.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

// ─────────── Env / Constants ───────────
const {
  APP_DOMAIN = "localhost",
  CORS_ORIGINS = "",
  NODE_ENV = "development",
  TRUST_PROXY,
} = process.env;

const isProd = NODE_ENV === "production";

const ALLOWED_ORIGINS = Object.freeze(
  CORS_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);
const ALLOWED_ORIGIN_SET = new Set(ALLOWED_ORIGINS);

const NO_STORE_HEADERS = Object.freeze({
  // "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  // Pragma: "no-cache",
  // Expires: "0",
  // "Surrogate-Control": "no-store",
});

// ─────────── CSRF Skip Config ───────────
// Add any route (method + path) here to skip CSRF for it
const CSRF_SKIP_ROUTES = [
  { method: "GET", path: "/api/auth/sessionCheck" },
  // Add more as needed: { method: "POST", path: "/api/some/other" }
];

function shouldSkipCsrf(req) {
  return CSRF_SKIP_ROUTES.some(
    (r) => r.method === req.method && r.path === req.path
  );
}

// ─────────── Main Setup ───────────
export default function setupSecurity(app) {
  // Trust proxy (so req.ip, req.secure etc. are correct behind a CDN/LB)
  if (TRUST_PROXY) {
    app.set("trust proxy", 1);
    logger.debug("[security] trust proxy enabled");
  }

  // Helmet baseline (keep prod-grade even in dev)
  app.use(
    helmet({
      // CSP intentionally off for now until we map asset origins
      contentSecurityPolicy: false,

      // We keep COEP off as we don't fetch cross-origin resources needing it
      crossOriginEmbedderPolicy: false,

      // Standard COOP;
      crossOriginOpenerPolicy: { policy: "same-origin" },

      // Friendlier than default but still protective
      crossOriginResourcePolicy: { policy: "same-site" },

      // Very private;
      referrerPolicy: { policy: "no-referrer" },

      // Never allow this app to be framed
      frameguard: { action: "deny" },
    })
  );
  logger.debug("[security] Helmet applied");

  // CORS
  if (!ALLOWED_ORIGINS.length) {
    logger.warn(
      "[security] No CORS_ORIGINS configured; only same-origin requests will work."
    );
  } else {
    logger.debug(
      `[security] CORS allowed origins: ${ALLOWED_ORIGINS.join(", ")}`
    );
  }

  const corsOptions = {
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "X-Csrf-Token",
      "X-Requested-With",
      "Authorization",
    ],
    origin(origin, cb) {
      // same-origin / server-to-server / curl with no Origin
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGIN_SET.has(origin)) return cb(null, true);
      // Deny and throw our custom error handler below
      return cb(new Error("CORS_BLOCKED_ORIGIN"));
    },
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));

  app.use((err, _req, res, next) => {
    if (err && err.message === "CORS_BLOCKED_ORIGIN") {
      return res.status(403).json({ error: "Not allowed by CORS" });
    }
    return next(err);
  });

  // Origin logging only in non-prod
  if (!isProd) {
    app.use((req, _res, next) => {
      if (req.headers.origin) {
        logger.debug(`[security] Incoming Origin: ${req.headers.origin}`);
      }
      next();
    });
  }

  // CSRF protection (skip for configured routes)
  app.use((req, res, next) => {
    if (shouldSkipCsrf(req)) return next();
    return csurf({
      cookie: csrfCookieOptions(),
      value: (req) =>
        req.headers["x-csrf-token"] ||
        (req.body && req.body._csrf) ||
        (req.query && req.query._csrf),
    })(req, res, next);
  });
  logger.debug("[security] CSRF protection enabled");

  // CSRF token endpoint (no-store headers)
  app.get("/csrf-token", (req, res) => {
    res.set(NO_STORE_HEADERS);
    res.json({ csrfToken: req.csrfToken() });
  });

  // CSRF error handler
  app.use((err, req, res, next) => {
    if (err && err.code === "EBADCSRFTOKEN") {
      logger.warn(
        `[security] Invalid CSRF token from IP ${req.ip} Path ${req.originalUrl}`
      );
      return res.status(403).json({ error: "Invalid CSRF token" });
    }
    return next(err);
  });
}
