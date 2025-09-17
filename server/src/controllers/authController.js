import authService from "../services/authService.js";

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export default { login };
