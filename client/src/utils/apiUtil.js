import { getCsrfToken, resetCsrfToken } from "./csrfUtil";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Utility function to make API requests with error handling
export async function apiRequest(url, options = {}) {
  try {
    const method = (options.method || "GET").toUpperCase();

    // Attach CSRF token for state-changing requests
    let headers = { "Content-Type": "application/json", ...options.headers };
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const token = await getCsrfToken();
      headers["X-CSRF-Token"] = token;
    }

    // Prepend API_BASE_URL if url starts with /api
    const fullUrl =
      url.startsWith("/api") && API_BASE_URL
        ? API_BASE_URL + url.replace(/^\/api/, "")
        : url;

    const res = await fetch(fullUrl, {
      credentials: "include",
      headers,
      ...options,
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      // Reset CSRF token if invalid
      if (res.status === 403 && data.message && data.message.includes("CSRF")) {
        resetCsrfToken();
      }
      throw new Error(data.message || "Something went wrong");
    }
    return data;
  } catch (err) {
    throw new Error(err.message || "Network error");
  }
}
