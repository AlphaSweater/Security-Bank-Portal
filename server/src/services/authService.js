// Business logic (stub)
async function login(email, password) {
  // later: lookup user in DB, compare password hashes, return JWT
  if (email === "test@example.com" && password === "password123") {
    return { token: "fake-jwt-token", user: { email } };
  }
  const err = new Error("Invalid credentials");
  err.status = 401;
  throw err;
}

export default { login };
