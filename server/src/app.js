import express from "express";
import security from "./config/security.js";
import errorHandler from "./middlewares/errorHandler.js";
import buildSessionMiddleware from "./middlewares/session.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import logger from "./logger.js";

// --- App Initialization ---
const app = express();


app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
	logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Incoming request');
	next();
});

// Security middleware (Helmet + CORS)
security(app);

// Session middleware
app.use(buildSessionMiddleware());

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// Error handler
app.use(errorHandler);

export default app;