const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

let csrfToken = null;

export async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  const fullUrl = API_BASE_URL
    ? API_BASE_URL + "/csrf-token"
    : "/api/csrf-token";
  const res = await fetch(fullUrl, { credentials: "include" });
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

export function resetCsrfToken() {
  csrfToken = null;
}
