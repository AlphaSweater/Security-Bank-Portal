import express from "express";
import cookieParser from "cookie-parser";
import setupSecurity from "#config/securityConfig.js";
import errorHandler from "#middlewares/errorHandlerMiddleware.js";
import session from "#middlewares/sessionMiddleware.js";
import authRoutes from "#routes/authRoutes.js";
import userRoutes from "#routes/userRoutes.js";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

// Check environment
const isDev = process.env.NODE_ENV !== "production";

// --- App Initialization ---
logger.info("Express app initialization");
const app = express();

// --- Middleware Registration ---
logger.info("Registering core middleware...");

// Body parsing with limit
app.use(express.json({ limit: "1mb" }));

// Request logging in development
if (isDev) {
  app.use((req, res, next) => {
    logger.info(
      { method: req.method, url: req.url, ip: req.ip },
      "Incoming request"
    );
    next();
  });
}

// Session management
app.use(session());

// Cookie parsing
app.use(cookieParser());

// Security headers and other protections
setupSecurity(app);

// Routes
logger.info("Registering routes...");
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.get("/health", (req, res) => res.status(200).send("OK"));

// Error handling (should be last)
app.use(errorHandler);

// Export the configured app
logger.info("App initialization complete!");

export default app;
