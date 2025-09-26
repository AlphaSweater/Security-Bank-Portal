import express from "express";
import cookieParser from "cookie-parser";
import setupSecurity from "#config/securityConfig.js";
import errorHandler from "#middlewares/errorHandlerMiddleware.js";
import session from "#middlewares/sessionMiddleware.js";
import authRoutes from "#routes/authRoutes.js";
import userRoutes from "#routes/userRoutes.js";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

// --- App Initialization ---
logger.info("Express app initialization...");
const app = express();

// --- Middleware Registration ---
logger.debug("Registering core middleware...");

// Body parsing with limit
app.use(express.json({ limit: "1mb" }));
logger.debug("JSON body parser registered with 1mb limit");

// Request logging in development
app.use((req, res, next) => {
  logger.debug(
    { method: req.method, url: req.url, ip: req.ip },
    "Incoming request"
  );
  next();
});

// Session management
app.use(session());
logger.debug("Session middleware registered");

// Cookie parsing
app.use(cookieParser());
logger.debug("Cookie parser middleware registered");

// Security headers and other protections
logger.debug("Applying security configurations...");
setupSecurity(app);
logger.debug("Security configurations applied!");

// Routes
logger.debug("Registering routes...");
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.get("/health", (req, res) => res.status(200).send("OK"));
logger.debug("Routes registered!");

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});
logger.debug("404 handler registered");

// Error handling (should be last)
app.use(errorHandler);
logger.debug("Error handling middleware registered");

// --- Finalization ---

// Export the configured app
logger.info("App initialization complete!");

export default app;
