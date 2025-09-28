import helmet from "helmet";
import cors from "cors";
import csurf from "csurf";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);
const appDomain = process.env.APP_DOMAIN || "localhost";
const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin) {
  logger.warn(
    "CORS_ORIGIN is not set. This may lead to security vulnerabilities."
  );
}

export default function setupSecurity(app) {
  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Adjust as needed for your frontend
    })
  );
  logger.debug("Helmet middleware applied");

  // Log incoming Origin header for CORS sanity check
  app.use((req, res, next) => {
    logger.debug(`Incoming CORS request from Origin: ${req.headers.origin}`);
    next();
  });

  // CORS
  app.use(
    cors({
      origin: corsOrigin,
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );
  logger.debug(`CORS configured for origin: ${corsOrigin}`);

  // CSRF Protection (after CORS, before routes)
  app.use(
    csurf({
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        domain: `.${appDomain}`,
      },
    })
  );
  logger.debug("CSRF protection middleware applied");

  // Route to provide CSRF token to frontend
  app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });
}
