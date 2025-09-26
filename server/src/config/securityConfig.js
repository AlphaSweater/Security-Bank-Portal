import helmet from "helmet";
import cors from "cors";
import csurf from "csurf";

// You can adjust these as needed or use environment variables
const corsOrigin = process.env.CORS_ORIGIN || "https://localhost:5173";

export default function setupSecurity(app) {
  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Adjust as needed for your frontend
    })
  );

  // CORS
  app.use(
    cors({
      origin: corsOrigin,
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );

  // CSRF Protection (after CORS, before routes)
  app.use(
    csurf({
      cookie: true, // Use cookies for CSRF tokens
    })
  );

  // Route to provide CSRF token to frontend
  app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });
}
