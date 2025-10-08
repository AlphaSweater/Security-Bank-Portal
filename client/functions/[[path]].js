/**
 * Global route gate for Cloudflare Pages.
 *
 * - Intercepts all HTML navigations.
 * - Public routes are always allowed.
 * - Everything else is protected by default.
 * - Supports future role-based restrictions.
 */

export const onRequest = async ({ request, env, next }) => {
  const url = new URL(request.url);
  const path = url.pathname;

  /* --------------------------------------------------------
   * Skip non-HTML requests (assets, etc.)
   * -------------------------------------------------------- */
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

  /* --------------------------------------------------------
   * Route access configuration
   * -------------------------------------------------------- */
  const ROUTES = {
    public: [
      /^\/$/, // Home
      /^\/login(\/|$)/,
      /^\/register(\/|$)/,
      /^\/about(\/|$)/,
      /^\/privacy(\/|$)/,
    ],

    // Optional: role-protected routes
    roles: {
      admin: [/^\/admin(\/|$)/],
      manager: [/^\/reports(\/|$)/],
      user: [/^\/dashboard(\/|$)/],
    },
  };

  /* --------------------------------------------------------
   * Determine route type
   * -------------------------------------------------------- */
  const isPublic = ROUTES.public.some((rx) => rx.test(path));
  if (isPublic) return next();

  // By default, everything else requires authentication
  const requiresAuth = true;

  /* --------------------------------------------------------
   * Check session via backend API
   * -------------------------------------------------------- */
  if (requiresAuth) {
    try {
      const probe = await fetch(`${env.API_BASE}/api/auth/sessionCheck`, {
        method: "GET",
        headers: {
          cookie: request.headers.get("cookie") || "",
          "x-forwarded-for": request.headers.get("cf-connecting-ip") || "",
        },
        redirect: "manual",
      });

      // Valid session
      if (probe.status === 200) {
        // (Optional) check roles if backend returns them
        const body = await probe.json().catch(() => ({}));
        const userRole = body.role || null;

        // If route is role-protected, ensure the user qualifies
        if (userRole && ROUTES.roles[userRole]) {
          const restricted = Object.entries(ROUTES.roles).find(
            ([role, patterns]) => patterns.some((rx) => rx.test(path))
          );

          if (restricted && restricted[0] !== userRole) {
            return Response.redirect(`${url.origin}/unauthorized`, 302);
          }
        }

        return next();
      }
    } catch (err) {
      console.error("Session check failed:", err);
    }

    // If we reach here, session is invalid or failed
    return Response.redirect(`${url.origin}/login`, 302);
  }

  /* --------------------------------------------------------
   * Fallback (shouldn't be hit normally)
   * -------------------------------------------------------- */
  return next();
};
