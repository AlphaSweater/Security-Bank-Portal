// Styles
import styles from "./AuthForms.module.css";

// Validation Schemas
import {
  registerUserSchema,
  loginUserSchema,
} from "../../utils/validation/userValidation";
import { useState, useEffect } from "react";

export default function AuthForms({ isLogin, onSwap }) {
  return (
    <div className={styles.authFormsContainer}>
      {isLogin ? (
        <LoginForm onSwap={onSwap} />
      ) : (
        <RegisterForm onSwap={onSwap} />
      )}
    </div>
  );
}

// -------------------
// Login Form
// -------------------

function LoginForm({ onSwap }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [errorTypes, setErrorTypes] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    const { error } = loginUserSchema.validate(form, { abortEarly: false });
    const nextErrors = {};
    const nextTypes = {};
    if (error && error.details) {
      for (const d of error.details) {
        nextErrors[d.path[0]] = d.message;
        nextTypes[d.path[0]] = d.type;
      }
    }
    setErrors(nextErrors);
    setErrorTypes(nextTypes);
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
    setSubmitAttempted(true);
    const { error } = loginUserSchema.validate(form, { abortEarly: false });
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors((e) => ({
          ...e,
          global: data.message || "Login failed. Try again.",
        }));
        setLoading(false);
        return;
      }
      // Optionally: redirect or update UI on success
      // window.location.href = "/dashboard";
    } catch (err) {
      setErrors((e) => ({ ...e, global: "Login failed. Try again." }));
    } finally {
      setLoading(false);
    }
  };

  // Helper: should show error for a field?
  function shouldShowError(field) {
    if (!errors[field]) return false;
    const type = errorTypes[field];
    if (type === "string.empty" || type === "any.required") {
      // Only show required errors after submit
      return submitAttempted;
    }
    // Show all other errors live (on blur or after submit)
    return touched[field] || submitAttempted;
  }

  return (
    <form className={styles.formBox} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>Log In</h2>
      <div className={styles.inputGroup}>
        <div className={styles.inputWrapper}>
          <div className={styles.floatingLabelGroup}>
            <input
              type="email"
              name="email"
              id="login-email"
              placeholder=" "
              className={`${styles.inputField} ${
                shouldShowError("email") ? styles.inputError : ""
              }`}
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="email"
            />
            <label htmlFor="login-email" className={styles.floatingLabel}>
              Email
            </label>
          </div>
          {shouldShowError("email") && (
            <p className={styles.errorText}>{errors.email}</p>
          )}
        </div>
        <div className={styles.inputWrapper}>
          <div className={styles.floatingLabelGroup}>
            <input
              type="password"
              name="password"
              id="login-password"
              placeholder=" "
              className={`${styles.inputField} ${
                shouldShowError("password") ? styles.inputError : ""
              }`}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="current-password"
            />
            <label htmlFor="login-password" className={styles.floatingLabel}>
              Password
            </label>
          </div>
          {shouldShowError("password") && (
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

// -------------------
// Register Form
// -------------------
function RegisterForm({ onSwap }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    saIdNumber: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});
  const [errorTypes, setErrorTypes] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    const { error } = registerUserSchema.validate(form, { abortEarly: false });
    const nextErrors = {};
    const nextTypes = {};
    if (error && error.details) {
      for (const d of error.details) {
        nextErrors[d.path[0]] = d.message;
        nextTypes[d.path[0]] = d.type;
      }
    }
    setErrors(nextErrors);
    setErrorTypes(nextTypes);
    setPasswordStrength(calculatePasswordStrength(form.password));
  }, [form]);

  function calculatePasswordStrength(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) score++;
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
    setSubmitAttempted(true);
    const { error } = registerUserSchema.validate(form, { abortEarly: false });
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          saIdNumber: form.saIdNumber,
          password: form.password,
          passwordConfirm: form.passwordConfirm,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors((e) => ({
          ...e,
          global: data.message || "Registration failed. Try again.",
        }));
        setLoading(false);
        return;
      }
      // Optionally: redirect or update UI on success
      // window.location.href = "/dashboard";
    } catch (err) {
      setErrors((e) => ({ ...e, global: "Registration failed. Try again." }));
    } finally {
      setLoading(false);
    }
  };

  // Helper: should show error for a field?
  function shouldShowError(field) {
    if (!errors[field]) return false;
    const type = errorTypes[field];
    if (type === "string.empty" || type === "any.required") {
      // Only show required errors after submit
      return submitAttempted;
    }
    // Show all other errors live (on blur or after submit)
    return touched[field] || submitAttempted;
  }

  return (
    <form className={styles.formBox} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>Sign Up</h2>
      <div className={styles.inputGroup}>
        <div className={styles.inputRow}>
          <div className={styles.inputWrapper}>
            <div className={styles.floatingLabelGroup}>
              <input
                type="text"
                name="firstName"
                id="register-firstName"
                placeholder=" "
                className={`${styles.inputField} ${
                  shouldShowError("firstName") ? styles.inputError : ""
                }`}
                value={form.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="given-name"
              />
              <label
                htmlFor="register-firstName"
                className={styles.floatingLabel}
                aria-required="true"
              >
                First Name
              </label>
            </div>
            {shouldShowError("firstName") && (
              <p className={styles.errorText}>{errors.firstName}</p>
            )}
          </div>
          <div className={styles.inputWrapper}>
            <div className={styles.floatingLabelGroup}>
              <input
                type="text"
                name="lastName"
                id="register-lastName"
                placeholder=" "
                className={`${styles.inputField} ${
                  shouldShowError("lastName") ? styles.inputError : ""
                }`}
                value={form.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="family-name"
              />
              <label
                htmlFor="register-lastName"
                className={styles.floatingLabel}
                aria-required="true"
              >
                Last Name
              </label>
            </div>
            {shouldShowError("lastName") && (
              <p className={styles.errorText}>{errors.lastName}</p>
            )}
          </div>
        </div>
        <div className={styles.inputWrapper}>
          <div className={styles.floatingLabelGroup}>
            <input
              type="email"
              name="email"
              id="register-email"
              placeholder=" "
              className={`${styles.inputField} ${
                shouldShowError("email") ? styles.inputError : ""
              }`}
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="email"
            />
            <label
              htmlFor="register-email"
              className={styles.floatingLabel}
              aria-required="true"
            >
              Email
            </label>
          </div>
          {shouldShowError("email") && (
            <p className={styles.errorText}>{errors.email}</p>
          )}
        </div>
        <div className={styles.inputWrapper}>
          <div className={styles.floatingLabelGroup}>
            <input
              type="text"
              name="saIdNumber"
              id="register-saIdNumber"
              placeholder=" "
              className={`${styles.inputField} ${
                shouldShowError("saIdNumber") ? styles.inputError : ""
              }`}
              value={form.saIdNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            <label
              htmlFor="register-saIdNumber"
              className={styles.floatingLabel}
              aria-required="true"
            >
              SA ID Number
            </label>
          </div>
          {shouldShowError("saIdNumber") && (
            <p className={styles.errorText}>{errors.saIdNumber}</p>
          )}
        </div>
        <div className={styles.inputWrapper}>
          <div className={styles.inputRow}>
            <div className={styles.floatingLabelGroup} style={{ flex: 1 }}>
              <input
                type="password"
                name="password"
                id="register-password"
                placeholder=" "
                className={`${styles.inputField} ${
                  shouldShowError("password") ? styles.inputError : ""
                }`}
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="new-password"
              />
              <label
                htmlFor="register-password"
                className={styles.floatingLabel}
                aria-required="true"
              >
                Password
              </label>
            </div>
            <div className={styles.floatingLabelGroup} style={{ flex: 1 }}>
              <input
                type="password"
                name="passwordConfirm"
                id="register-passwordConfirm"
                placeholder=" "
                className={`${styles.inputField} ${
                  shouldShowError("passwordConfirm") ? styles.inputError : ""
                } ${shouldShowError("password") ? styles.inputError : ""}`}
                value={form.passwordConfirm}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="new-password"
              />
              <label
                htmlFor="register-passwordConfirm"
                className={styles.floatingLabel}
                aria-required="true"
              >
                Confirm Password
              </label>
            </div>
          </div>
          {shouldShowError("password") && (
            <p className={styles.errorText}>{errors.password}</p>
          )}
          {shouldShowError("passwordConfirm") && (
            <p className={styles.errorText}>{errors.passwordConfirm}</p>
          )}
          {/* Modern password strength bar */}
          <div className={styles.passwordStrengthBar}>
            <div
              className={styles.passwordStrengthBarFill}
              style={{
                width: `${(passwordStrength / 5) * 100}%`,
                background:
                  passwordStrength <= 1
                    ? "linear-gradient(90deg, #e63946 60%, #fbbf24 100%)"
                    : passwordStrength <= 3
                    ? "linear-gradient(90deg, #fbbf24 40%, #10b981 100%)"
                    : "linear-gradient(90deg, #10b981 80%, #22d3ee 100%)",
              }}
            />
          </div>
          <div className={styles.passwordStrengthLabel}>
            {passwordStrength <= 1 ? (
              <span style={{ color: "#e63946" }}>Weak</span>
            ) : passwordStrength <= 3 ? (
              <span style={{ color: "#fbbf24" }}>Okay</span>
            ) : (
              <span style={{ color: "#10b981" }}>Strong</span>
            )}
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
