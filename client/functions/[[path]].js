/**
 * Global HTML route gate for Cloudflare Pages.
 * - Lets public routes through.
 * - Probes API with the session cookie for protected routes.
 * - Optional role-based enforcement.
 */
export const onRequest = async ({ request, env, next }) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // 0) Passthrough for API and static assets
  if (path.startsWith("/api/")) {
    console.log("Passthrough: API route", path);
    return next();
  }
  if (/\.(js|css|png|jpg|jpeg|webp|svg|ico|map|woff2?|ttf)$/i.test(path)) {
    return next();
  }

  // Guard only top-level HTML navigations
  const accepts = request.headers.get("accept") || "";
  const secDest = request.headers.get("sec-fetch-dest") || "";
  const isHtmlNav =
    request.method === "GET" &&
    (accepts.includes("text/html") || secDest === "document");
  if (!isHtmlNav) {
    return next();
  }

  // 1) Routes
  const ROUTES = {
    public: [
      /^\/$/,
      /^\/auth(\/|$)/,
      /^\/auth\/forgot-password(\/|$)/,
      /^\/auth\/reset-password(\/|$)/,
      /^\/about(\/|$)/,
      /^\/privacy(\/|$)/,
      /^\/unauthorized(\/|$)/,
    ],
    // Maps route patterns to allowed roles (admin always has access)
    roles: {
      "/dashboard": ["customer", "employee", "admin"],
      "/admin/employees": ["admin"],
      "/transaction": ["customer", "admin"],
      "/transactions/pending": ["employee", "admin"],
      "/transactions/review": ["employee", "admin"],
      "/transactions/history": ["employee", "admin"],
      "/transactions/approved": ["employee", "admin"],
      "/transactions/rejected": ["employee", "admin"],
    },
  };

  // Public paths allowed
  if (ROUTES.public.some((rx) => rx.test(path))) {
    return next();
  }

  // 2) Env + cookie extraction
  const apiBase = env.VITE_API_BASE_URL;

  if (!apiBase) {
    console.error("Missing env.VITE_API_BASE_URL");
    const loginUrl = new URL("/auth", url);
    loginUrl.searchParams.set("next", path + url.search);
    return Response.redirect(loginUrl.toString(), 302);
  }

  const rawCookie = request.headers.get("cookie") || "";
  const SESSION_COOKIE_NAME = env.SESSION_COOKIE_NAME;
  const sessionCookie = rawCookie
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.toLowerCase().startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!sessionCookie) {
    console.error("Missing session cookie", { rawCookie, SESSION_COOKIE_NAME });
    const loginUrl = new URL("/auth", url);
    loginUrl.searchParams.set("next", path + url.search);
    return Response.redirect(loginUrl.toString(), 302);
  }

  // 3) Probe API (GET, CSRF-free)
  let probe;
  try {
    console.log("Probing session with cookie", { sessionCookie });
    probe = await fetch(`${apiBase}/api/auth/sessionCheck`, {
      method: "GET",
      headers: {
        cookie: sessionCookie, // forward only the session cookie
      },
      redirect: "manual",
    });
  } catch (err) {
    console.error("Session probe failed:", {
      error: err,
      apiBase,
      sessionCookie,
    });
    const loginUrl = new URL("/auth", url);
    loginUrl.searchParams.set("next", path + url.search);
    return Response.redirect(loginUrl.toString(), 302);
  }

  // 4) Handle probe result
  if (probe.ok) {
    // Role gate (optional)
    // Find if this route requires specific roles.
    // Support parameterized routes like `/transactions/review/:id` by
    // converting route patterns to regexes. Also match plain prefixes
    // (e.g. `/dashboard`) and allow exact matches.
    const routeToRegex = (routePattern) => {
      // Escape regex special chars except ':' which we use for params
      const escaped = routePattern.replace(/[-/\\^$*+?.()|[\]{}]/g, (m) => {
        // keep ':' so we can convert :param to a segment matcher
        return m === ":" ? ":" : `\\${m}`;
      });

      // Replace :param with a single-segment matcher ([^/]+)
      const withParams = escaped.replace(/:([a-zA-Z0-9_]+)/g, "[^/]+");

      // Match either exact route or route + '/' + more (so /x and /x/123)
      return new RegExp(`^${withParams}(?:$|/)`);
    };

    const matchedRoute = Object.entries(ROUTES.roles).find(([routePath]) => {
      try {
        const rx = routeToRegex(routePath);
        return rx.test(path);
      } catch (err) {
        // Fallback to previous behavior on any regex construction error
        return path === routePath || path.startsWith(routePath + "/");
      }
    });

    if (!matchedRoute) {
      // No role required for this route
      return next();
    }

    let role = null;
    try {
      if (
        (probe.headers.get("content-type") || "").includes("application/json")
      ) {
        const body = await probe.clone().json();
        role = body?.role ?? null;
      }
    } catch (err) {
      console.error("Failed to parse sessionCheck JSON", { error: err });
    }

    const [, allowedRoles] = matchedRoute;

    // Check if user's role is in the allowed roles for this route
    if (!role || !allowedRoles.includes(role)) {
      console.error(
        `Role mismatch: route requires one of [${allowedRoles.join(
          ", "
        )}], user has ${role}`
      );
      return Response.redirect(new URL("/unauthorized", url).toString(), 302);
    }

    return next();
  }

  // Unauthed or redirected by API => go to /auth with next
  if (
    probe.status === 401 ||
    probe.status === 403 ||
    (probe.status >= 300 && probe.status < 400)
  ) {
    console.error("SessionCheck: unauthorized or redirected", {
      status: probe.status,
      location: probe.headers.get("location"),
    });
    const loginUrl = new URL("/auth", url);
    loginUrl.searchParams.set("next", path + url.search);
    return Response.redirect(loginUrl.toString(), 302);
  }

  console.error("Unexpected sessionCheck status:", probe.status);
  const loginUrl = new URL("/auth", url);
  loginUrl.searchParams.set("next", path + url.search);
  return Response.redirect(loginUrl.toString(), 302);
};
