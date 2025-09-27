import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session?.roles) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const hasRole = req.session.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}
