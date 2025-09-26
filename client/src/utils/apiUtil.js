import { getCsrfToken, resetCsrfToken } from "./csrfUtil";

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

    const res = await fetch(url, {
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
