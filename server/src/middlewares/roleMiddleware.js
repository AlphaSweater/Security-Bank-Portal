import { getLogger } from "#utils/logger.js";

const logger = getLogger(import.meta.url);

const ROLE_ALIASES = {
  customer: ["customer"],
  employee: ["employee"],
  admin: ["admin"],
};

function normalizeSessionRoles(req) {
  let roles = [];
  // Prefer explicit array on session
  if (Array.isArray(req.session?.roles)) roles = req.session.roles;
  // Fallback to a single role string
  else if (typeof req.session?.role === "string") roles = [req.session.role];
  // Fallback to nested user object
  else if (typeof req.session?.user?.role === "string")
    roles = [req.session.user.role];

  return roles.filter(Boolean).map((r) => String(r).toLowerCase().trim());
}

function expandAllowedRoles(allowedRoles) {
  const set = new Set();
  for (const role of allowedRoles) {
    const key = String(role).toLowerCase().trim();
    set.add(key);
    // Include any aliases for this role
    const aliases = ROLE_ALIASES[key] || [];
    for (const alias of aliases) set.add(alias);
  }
  return set;
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // If the user isn't authenticated at all, it's 401 (should be caught by requireAuth earlier)
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRoles = normalizeSessionRoles(req);
    const allowed = expandAllowedRoles(allowedRoles);

    const hasRole = userRoles.some((r) => allowed.has(r));

    if (!hasRole) {
      logger.warn(
        {
          path: req.path,
          required: Array.from(allowed),
          userRoles,
          userId: req.session?.userId,
        },
        "Forbidden: user lacks required role(s)"
      );
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}
