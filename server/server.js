import express from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "fs";
import https from "https";
import http from "http";
import errorHandler from "./middleware/errorHandler.js";
import config from "./config/config.js";


// --- App Initialization ---
const app = express();

// =============================
//  MIDDLEWARE SECTION
// =============================

// --- Security Headers ---
app.use(helmet({
  contentSecurityPolicy: false, // Adjust as needed for your frontend
}));

// --- Body Parsing ---
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// --- CORS ---
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// --- Logging Middleware (Future) ---
// e.g., morgan, winston, or custom logger
// app.use(logger);

// --- Authentication Middleware (Future) ---
// e.g., passport, JWT, OAuth
// app.use(authMiddleware);

// =============================
//  ROUTES SECTION
// =============================

// --- Health Check / Root ---
app.get("/", (req, res) => {
  res.send("Secure API is running 🚀");
});

// --- API Routes ---
app.get("/api", (req, res) => {
  res.send("Hello from the /api endpoint");
});

// --- Future: Mount More Routers Here ---
// app.use('/auth', authRouter);
// app.use('/users', usersRouter);
// app.use('/transactions', transactionsRouter);

// --- Static Files (Future) ---
// app.use(express.static(path.join(__dirname, '../public')));

// --- Error Handler (last) ---
app.use(errorHandler);

// =============================
//  SERVER SECTION
// =============================

// --- HTTPS/HTTP Server Setup ---
const sslOptions = {
  key: fs.readFileSync(`${config.certPath}/${config.certKey}`),
  cert: fs.readFileSync(`${config.certPath}/${config.certCrt}`),
};

// --- Start HTTPS Server ---
https.createServer(sslOptions, app).listen(config.httpsPort, () => {
  console.log(`HTTPS Server running on port ${config.httpsPort}`);
});

// --- Start HTTP Server (redirects to HTTPS) ---
http.createServer((req, res) => {
  const host = req.headers.host ? req.headers.host.replace(/:\d+$/, ":" + config.httpsPort) : `localhost:${config.httpsPort}`;
  res.writeHead(301, { "Location": `https://${host}${req.url}` });
  res.end();
}).listen(config.httpPort, () => {
  console.log(`HTTP Server running on port ${config.httpPort} (redirects to HTTPS)`);
});

