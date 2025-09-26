// Utility function to make API requests with error handling
export async function apiRequest(url, options = {}) {
  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      throw new Error(data.message || "Something went wrong");
    }
    return data;
  } catch (err) {
    throw new Error(err.message || "Network error");
  }
}
