// ==================================================
// Cookie configuration for CSRF + Session cookies
// ==================================================

const { APP_DOMAIN = "localhost" } = process.env;

// Returns undefined for localhost (so cookie is host-only) or ".example.com" for subdomain sharing.
export function cookieDomain() {
  if (APP_DOMAIN === "localhost" || APP_DOMAIN === "127.0.0.1")
    return undefined;
  return `.${APP_DOMAIN}`;
}

// Base cookie options used by both CSRF + Session.
export function baseCookie() {
  return {
    httpOnly: true, // not readable by JS
    secure: true, // HTTPS only
    sameSite: "lax", // allow some cross-site usage for our subdomains
    domain: cookieDomain(), // undefined on localhost
  };
}

// CSRF cookie options.
export function csrfCookieOptions() {
  return { ...baseCookie() };
}

// Session cookie options.
// Optionally pass maxAge (in ms). Default: 30 minutes.
export function sessionCookieOptions(maxAge = 1000 * 60 * 30) {
  return { ...baseCookie(), maxAge };
}
