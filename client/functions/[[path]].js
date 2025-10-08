/**
 * Global route gate for Cloudflare Pages (HTML only).
 * - Allows public routes.
 * - Gates all other HTML routes via backend session probe.
 * - Optional role-based route enforcement.
 */

export const onRequest = async ({ request, env, next }) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // We skip API paths entirely (the client calls these for the backend)
  if (path.startsWith("/api/")) return next();

  // We only intercept top-level HTML navigations
  const isAsset = /\.(js|css|png|jpg|jpeg|webp|svg|ico|map|woff2?|ttf)$/i.test(
    path
  );
  const accepts = request.headers.get("accept") || "";
  const secDest = request.headers.get("sec-fetch-dest") || "";
  const isHtmlNav =
    request.method === "GET" &&
    !isAsset &&
    (accepts.includes("text/html") || secDest === "document");

  if (!isHtmlNav) return next();

  // Route config
  const ROUTES = {
    public: [
      /^\/$/, // landing page
      /^\/login(\/|$)/,
      /^\/register(\/|$)/,
      /^\/about(\/|$)/,
      /^\/privacy(\/|$)/,
      /^\/unauthorized(\/|$)/, // optional info page
    ],

    roles: {
      admin: [/^\/admin(\/|$)/],
      employee: [/^\/reports(\/|$)/],
      customer: [/^\/dashboard(\/|$)/],
    },
  };

  // 3) Allow public
  if (ROUTES.public.some((rx) => rx.test(path))) return next();

  // 4) Everything else requires auth
  const apiBase = env.VITE_API_BASE_URL;

  try {
    const probe = await fetch(`${apiBase}/api/auth/sessionCheck`, {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") || "",
        "x-forwarded-for": request.headers.get("cf-connecting-ip") || "",
      },
      redirect: "manual",
    });

    if (probe.status === 200) {
      // Optional role handling
      let userRole = null;
      const ctype = probe.headers.get("content-type") || "";
      if (ctype.includes("application/json")) {
        const body = await probe.json().catch(() => ({}));
        userRole = body.role || null;
      }

      // If this path is role-restricted, ensure user has the matching role
      const matchedRole = Object.entries(ROUTES.roles).find(([, patterns]) =>
        patterns.some((rx) => rx.test(path))
      );
      if (matchedRole) {
        const [requiredRole] = matchedRole;
        if (!userRole || userRole !== requiredRole) {
          return Response.redirect(
            new URL("/unauthorized", url).toString(),
            302
          );
        }
      }

      // Auth (and role, if any) OK → allow
      return next();
    }
  } catch (err) {
    // fall through to fail-closed
    console.error("Session check failed:", err);
  }

  // 5) Unauthed or probe failed → go to login
  return Response.redirect(new URL("/login", url).toString(), 302);
};
