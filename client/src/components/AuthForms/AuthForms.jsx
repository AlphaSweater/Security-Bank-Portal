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
      // TODO: Implement login logic
      await new Promise((res) => setTimeout(res, 800));
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
          <input
            type="email"
            name="email"
            placeholder="Email"
            className={`${styles.inputField} ${
              shouldShowError("email") ? styles.inputError : ""
            }`}
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="email"
          />
          {shouldShowError("email") && (
            <p className={styles.errorText}>{errors.email}</p>
          )}
        </div>
        <div className={styles.inputWrapper}>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className={`${styles.inputField} ${
              shouldShowError("password") ? styles.inputError : ""
            }`}
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="current-password"
          />
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
      // TODO: Implement register logic
      await new Promise((res) => setTimeout(res, 800));
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
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              className={`${styles.inputField} ${
                shouldShowError("firstName") ? styles.inputError : ""
              }`}
              value={form.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="given-name"
            />
            {shouldShowError("firstName") && (
              <p className={styles.errorText}>{errors.firstName}</p>
            )}
          </div>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className={`${styles.inputField} ${
                shouldShowError("lastName") ? styles.inputError : ""
              }`}
              value={form.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="family-name"
            />
            {shouldShowError("lastName") && (
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
              shouldShowError("email") ? styles.inputError : ""
            }`}
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            autoComplete="email"
          />
          {shouldShowError("email") && (
            <p className={styles.errorText}>{errors.email}</p>
          )}
        </div>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            name="saIdNumber"
            placeholder="SA ID Number"
            className={`${styles.inputField} ${
              shouldShowError("saIdNumber") ? styles.inputError : ""
            }`}
            value={form.saIdNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {shouldShowError("saIdNumber") && (
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
                shouldShowError("password") ? styles.inputError : ""
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
                shouldShowError("passwordConfirm") ? styles.inputError : ""
              } ${shouldShowError("password") ? styles.inputError : ""}`}
              value={form.passwordConfirm}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="new-password"
            />
          </div>
          {shouldShowError("password") && (
            <p className={styles.errorText}>{errors.password}</p>
          )}
          {shouldShowError("passwordConfirm") && (
            <p className={styles.errorText}>{errors.passwordConfirm}</p>
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
