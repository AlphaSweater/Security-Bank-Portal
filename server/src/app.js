import express from "express";
import setupSecurity from "#config/securityConfig.js";
import errorHandler from "#middlewares/errorHandlerMiddleware.js";
import session from "#middlewares/sessionMiddleware.js";
import authRoutes from "#routes/authRoutes.js";
import userRoutes from "#routes/userRoutes.js";
import { getLogger } from "#utils/logger.js";
const logger = getLogger(import.meta.url);

// --- App Initialization ---
logger.info("Express app initialization");
const app = express();

// --- Middleware Registration ---
logger.info("Registering core middleware...");

// Body parsing
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(
    { method: req.method, url: req.url, ip: req.ip },
    "Incoming request"
  );
  next();
});

// Security headers and other protections
setupSecurity(app);

// Session management
app.use(session());

// Routes
logger.info("Registering routes...");
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// Error handling (should be last)
app.use(errorHandler);

// Export the configured app
logger.info("App initialization complete!");

export default app;
