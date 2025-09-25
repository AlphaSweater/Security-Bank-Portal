// External Dependencies
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Assets
import reactLogo from "../../assets/react.svg";

// UI Components
import Joi from "joi";
import { useEffect } from "react";

// Styles
import styles from "./AuthPage.module.css";

// Animation Variants
const slideVariants = {
  initial: (direction) => ({
    x: direction > 0 ? 150 : -150,
    opacity: 0,
    width: "100%",
  }),
  animate: {
    x: 0,
    opacity: 1,
    width: "100%",
    transition: { duration: 0.18, ease: "easeInOut" },
  },
  exit: (direction) => ({
    x: direction < 0 ? 150 : -150,
    opacity: 0,
    width: "100%",
    transition: { duration: 0.18, ease: "easeInOut" },
  }),
};

// Default Function Export
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [direction, setDirection] = useState(1); // 1 → right, -1 → left

  const handleSwap = () => {
    setDirection(isLogin ? 1 : -1);
    setIsLogin((v) => !v);
  };

  return (
    <section className={styles.page}>
      <div className={styles.contentRow}>
        {/* Hero Area */}
        <div className={styles.heroArea}>
          <img src={reactLogo} alt="React logo" className={styles.heroLogo} />
          <h1 className={styles.heroTitle}>
            {isLogin ? "Welcome Back!" : "Join Us Today!"}
          </h1>
          <p className={styles.heroSubtitle}>
            {isLogin
              ? "Log in to access your account \n and manage your finances."
              : "Create an account to start managing your finances with us."}
          </p>
        </div>
        {/* Forms Area (inlined) */}
        <div className={styles.formsArea}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={isLogin ? "login" : "register"}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              custom={direction}
              style={{ width: "100%", height: "100%" }}
            >
              <div className={styles.authFormsContainer}>
                {isLogin ? (
                  <LoginForm onSwap={handleSwap} />
                ) : (
                  <RegisterForm onSwap={handleSwap} />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// --- Inlined LoginForm ---
function LoginForm({ onSwap }) {
  const loginSchema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        "string.empty": "Email is required",
        "string.email": "Please enter a valid email",
      }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required",
    }),
  });

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { error } = loginSchema.validate(form, { abortEarly: false });
    const nextErrors = {};
    if (error && error.details) {
      for (const d of error.details) {
        nextErrors[d.path[0]] = d.message;
      }
    }
    setErrors(nextErrors);
  }, [form]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }
  function handleBlur(e) {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = loginSchema.validate(form, { abortEarly: false });
    if (error) {
      const nextErrors = {};
      for (const d of error.details) {
        nextErrors[d.path[0]] = d.message;
      }
      setErrors(nextErrors);
      setTouched({ email: true, password: true });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      // TODO: Implement login logic
      await new Promise((res) => setTimeout(res, 800));
    } catch (err) {
      setErrors((e) => ({ ...e, global: "Login failed. Try again." }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formBox} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>Log In</h2>
      <div className={styles.inputGroup}>
        <div className={styles.inputWrapper}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className={`${styles.inputField} ${
              touched.email && errors.email ? styles.inputError : ""
            }`}
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="email"
          />
          {touched.email && errors.email && (
            <p className={styles.errorText}>{errors.email}</p>
          )}
        </div>
        <div className={styles.inputWrapper}>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className={`${styles.inputField} ${
              touched.password && errors.password ? styles.inputError : ""
            }`}
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="current-password"
          />
          {touched.password && errors.password && (
            <p className={styles.errorText}>{errors.password}</p>
          )}
        </div>
      </div>
      {errors.global && (
        <div className={styles.errorBox}>
          <p className={styles.errorText}>{errors.global}</p>
        </div>
      )}
      <div className={styles.buttonGroup}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
        <p className={styles.textCenter}>
          <button type="button" onClick={onSwap} className={styles.switchLink}>
            Need an account? Sign Up Here!
          </button>
        </p>
      </div>
    </form>
  );
}

// --- Inlined RegisterForm ---
function RegisterForm({ onSwap }) {
  const registerSchema = Joi.object({
    firstName: Joi.string().min(2).max(100).required().messages({
      "string.empty": "First name is required",
      "string.min": "First name must be at least 2 characters",
    }),
    lastName: Joi.string().min(2).max(100).required().messages({
      "string.empty": "Last name is required",
      "string.min": "Last name must be at least 2 characters",
    }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        "string.empty": "Email is required",
        "string.email": "Please enter a valid email",
      }),
    saIdNumber: Joi.string()
      .pattern(/^\d{13}$/)
      .required()
      .messages({
        "string.empty": "SA ID Number is required",
        "string.pattern.base": "SA ID Number must be 13 digits",
      }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp("(?=.*[a-z])"))
      .pattern(new RegExp("(?=.*[A-Z])"))
      .pattern(new RegExp("(?=.*[0-9])"))
      .pattern(new RegExp("(?=.*[!@#$%^&*()_+-=[]{};':\"\\|,.<>/?])"))
      .required()
      .messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 8 characters",
        "string.pattern.base":
          "Password must include upper, lower, number and special character",
      }),
    passwordConfirm: Joi.any().valid(Joi.ref("password")).required().messages({
      "any.only": "Passwords do not match",
      "any.required": "Please confirm your password",
    }),
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    saIdNumber: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const { error } = registerSchema.validate(form, { abortEarly: false });
    const nextErrors = {};
    if (error && error.details) {
      for (const d of error.details) {
        nextErrors[d.path[0]] = d.message;
      }
    }
    setErrors(nextErrors);
    setPasswordStrength(calculatePasswordStrength(form.password));
  }, [form]);

  function calculatePasswordStrength(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?]/.test(pw)) score++;
    return score; // 0..5
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }
  function handleBlur(e) {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = registerSchema.validate(form, { abortEarly: false });
    if (error) {
      const nextErrors = {};
      for (const d of error.details) {
        nextErrors[d.path[0]] = d.message;
      }
      setErrors(nextErrors);
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        saIdNumber: true,
        password: true,
        passwordConfirm: true,
      });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      // TODO: Implement register logic
      await new Promise((res) => setTimeout(res, 800));
    } catch (err) {
      setErrors((e) => ({ ...e, global: "Registration failed. Try again." }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formBox} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>Sign Up</h2>
      <div className={styles.inputGroup}>
        <div className={styles.inputRow}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              className={`${styles.inputField} ${
                touched.firstName && errors.firstName ? styles.inputError : ""
              }`}
              value={form.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="given-name"
            />
            {touched.firstName && errors.firstName && (
              <p className={styles.errorText}>{errors.firstName}</p>
            )}
          </div>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className={`${styles.inputField} ${
                touched.lastName && errors.lastName ? styles.inputError : ""
              }`}
              value={form.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="family-name"
            />
            {touched.lastName && errors.lastName && (
              <p className={styles.errorText}>{errors.lastName}</p>
            )}
          </div>
        </div>
        <div className={styles.inputWrapper}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className={`${styles.inputField} ${
              touched.email && errors.email ? styles.inputError : ""
            }`}
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="email"
          />
          {touched.email && errors.email && (
            <p className={styles.errorText}>{errors.email}</p>
          )}
        </div>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            name="saIdNumber"
            placeholder="SA ID Number"
            className={`${styles.inputField} ${
              touched.saIdNumber && errors.saIdNumber ? styles.inputError : ""
            }`}
            value={form.saIdNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {touched.saIdNumber && errors.saIdNumber && (
            <p className={styles.errorText}>{errors.saIdNumber}</p>
          )}
        </div>
        <div className={styles.inputWrapper}>
          <div className={styles.inputRow}>
            <input
              type="password"
              name="password"
              placeholder="Password"
              className={`${styles.inputField} ${
                touched.password && errors.password ? styles.inputError : ""
              }`}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="new-password"
            />
            <input
              type="password"
              name="passwordConfirm"
              placeholder="Confirm Password"
              className={`${styles.inputField} ${
                touched.passwordConfirm && errors.passwordConfirm
                  ? styles.inputError
                  : ""
              } ${
                touched.password && errors.password ? styles.inputError : ""
              }`}
              value={form.passwordConfirm}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="new-password"
            />
          </div>
          {touched.password && errors.password && (
            <p className={styles.errorText}>{errors.password}</p>
          )}
          {/* Password strength meter */}
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                height: 6,
                width: "100%",
                background: "#eee",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(passwordStrength / 5) * 100}%`,
                  height: "100%",
                  background:
                    passwordStrength <= 1
                      ? "#e63946"
                      : passwordStrength <= 3
                      ? "#fbbf24"
                      : "#10b981",
                  transition: "width 0.2s",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#888",
                marginTop: 2,
                textAlign: "left",
              }}
            >
              {passwordStrength <= 1
                ? "Weak"
                : passwordStrength <= 3
                ? "Okay"
                : "Strong"}
            </div>
          </div>
        </div>
      </div>
      {errors.global && (
        <div className={styles.errorBox}>
          <p className={styles.errorText}>{errors.global}</p>
        </div>
      )}
      <div className={styles.buttonGroup}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        <p className={styles.textCenter}>
          <button type="button" onClick={onSwap} className={styles.switchLink}>
            Already have an account? Log In
          </button>
        </p>
      </div>
    </form>
  );
}

export default AuthPage;
