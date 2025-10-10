import express from "express";
import cookieParser from "cookie-parser";
import setupSecurity from "#config/securityConfig.js";
import errorHandler from "#middlewares/errorHandlerMiddleware.js";
import session from "#middlewares/sessionMiddleware.js";
import authRoutes from "#routes/authRoutes.js";
import userRoutes from "#routes/userRoutes.js";
import transactionRoutes from "#routes/transactionRoutes.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

// Initialize Express app
logger.info("Initializing Express app...");
const app = express();

// Register core middleware
logger.info("Registering core middleware");
app.set("trust proxy", 1); // Trust first proxy (like Render, Heroku, etc.)
app.use(express.json({ limit: "1mb" })); // Parse JSON bodies, 1mb limit
app.use(cookieParser()); // Parse cookies
app.use(await session()); // Set up session management

// Log incoming requests (development only)
app.use((req, res, next) => {
  logger.debug(
    { method: req.method, url: req.url, ip: req.ip },
    "Incoming request"
  );
  next();
});

// Apply security headers and protections
setupSecurity(app);

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.get("/api/health", (req, res) => res.status(200).send("OK"));

// 404 handler (for unmatched routes)
app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handling middleware
app.use(errorHandler);

logger.info("Express app ready!");
export default app;
