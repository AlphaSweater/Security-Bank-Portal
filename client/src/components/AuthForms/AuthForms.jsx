// External Imports
import { useState, useEffect } from "react";

// Internal Imports
import { apiRequest } from "../../utils/api";
import {
  registerUserSchema,
  loginUserSchema,
} from "../../utils/validation/userValidation";

// Styles
import styles from "./AuthForms.module.css";

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
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Reusable validator
  function validate(values) {
    const { error } = loginUserSchema.validate(values, { abortEarly: false });
    if (!error) return {};
    return error.details.reduce(
      (acc, d) => ({ ...acc, [d.path[0]]: d.message }),
      {}
    );
  }

  const currentErrors = validate(form);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleBlur(e) {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      // ✅ handle success (redirect, toast, etc.)
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setLoading(false);
    }
  }

  function shouldShowError(field) {
    return currentErrors[field] && (touched[field] || submitAttempted);
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
              placeholder=" "
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="email"
              aria-invalid={!!shouldShowError("email")}
              className={`${styles.inputField} ${
                shouldShowError("email") ? styles.inputError : ""
              }`}
            />
            <label
              className={styles.floatingLabel}
              aria-required="true"
              htmlFor={undefined}
            >
              Email
            </label>
          </div>
          {shouldShowError("email") && (
            <p className={styles.errorText}>{currentErrors.email}</p>
          )}
        </div>

        <div className={styles.inputWrapper}>
          <div className={styles.floatingLabelGroup}>
            <input
              type="password"
              name="password"
              placeholder=" "
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="current-password"
              aria-invalid={!!shouldShowError("password")}
              className={`${styles.inputField} ${
                shouldShowError("password") ? styles.inputError : ""
              }`}
            />
            <label
              className={styles.floatingLabel}
              aria-required="true"
              htmlFor={undefined}
            >
              Password
            </label>
          </div>
          {shouldShowError("password") && (
            <p className={styles.errorText}>{currentErrors.password}</p>
          )}
        </div>
      </div>

      {errors.global && (
        <div className={styles.errorBox}>
          <p>{errors.global}</p>
        </div>
      )}

      <div className={styles.buttonGroup}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={submitAttempted && Object.keys(currentErrors).length > 0}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
        <p>
          <button type="button" onClick={onSwap} className={styles.switchLink}>
            Need an account? Sign Up
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
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // ✅ Validation helper
  function validate(values) {
    const { error } = registerUserSchema.validate(values, {
      abortEarly: false,
    });
    if (!error) return {};
    return error.details.reduce(
      (acc, d) => ({ ...acc, [d.path[0]]: d.message }),
      {}
    );
  }

  const currentErrors = validate(form);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleBlur(e) {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
  }

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
  const passwordStrength = calculatePasswordStrength(form.password);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      // ✅ Handle success (toast, redirect, etc.)
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setLoading(false);
    }
  }

  function shouldShowError(field) {
    return currentErrors[field] && (touched[field] || submitAttempted);
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
                placeholder=" "
                value={form.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="given-name"
                aria-invalid={!!shouldShowError("firstName")}
                className={`${styles.inputField} ${
                  shouldShowError("firstName") ? styles.inputError : ""
                }`}
              />
              <label
                className={styles.floatingLabel}
                aria-required="true"
                htmlFor={undefined}
              >
                First Name
              </label>
            </div>
            {shouldShowError("firstName") && (
              <p className={styles.errorText}>{currentErrors.firstName}</p>
            )}
          </div>

          <div className={styles.inputWrapper}>
            <div className={styles.floatingLabelGroup}>
              <input
                type="text"
                name="lastName"
                placeholder=" "
                value={form.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="family-name"
                aria-invalid={!!shouldShowError("lastName")}
                className={`${styles.inputField} ${
                  shouldShowError("lastName") ? styles.inputError : ""
                }`}
              />
              <label
                className={styles.floatingLabel}
                aria-required="true"
                htmlFor={undefined}
              >
                Last Name
              </label>
            </div>
            {shouldShowError("lastName") && (
              <p className={styles.errorText}>{currentErrors.lastName}</p>
            )}
          </div>
        </div>

        <div className={styles.inputWrapper}>
          <div className={styles.floatingLabelGroup}>
            <input
              type="email"
              name="email"
              placeholder=" "
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="email"
              aria-invalid={!!shouldShowError("email")}
              className={`${styles.inputField} ${
                shouldShowError("email") ? styles.inputError : ""
              }`}
            />
            <label
              className={styles.floatingLabel}
              aria-required="true"
              htmlFor={undefined}
            >
              Email
            </label>
          </div>
          {shouldShowError("email") && (
            <p className={styles.errorText}>{currentErrors.email}</p>
          )}
        </div>

        <div className={styles.inputWrapper}>
          <div className={styles.floatingLabelGroup}>
            <input
              type="text"
              name="saIdNumber"
              placeholder=" "
              value={form.saIdNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={!!shouldShowError("saIdNumber")}
              className={`${styles.inputField} ${
                shouldShowError("saIdNumber") ? styles.inputError : ""
              }`}
            />
            <label
              className={styles.floatingLabel}
              aria-required="true"
              htmlFor={undefined}
            >
              SA ID Number
            </label>
          </div>
          {shouldShowError("saIdNumber") && (
            <p className={styles.errorText}>{currentErrors.saIdNumber}</p>
          )}
        </div>

        <div className={styles.inputRow}>
          <div className={styles.inputWrapper} style={{ flex: 1 }}>
            <div className={styles.floatingLabelGroup}>
              <input
                type="password"
                name="password"
                placeholder=" "
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="new-password"
                aria-invalid={!!shouldShowError("password")}
                className={`${styles.inputField} ${
                  shouldShowError("password") ? styles.inputError : ""
                }`}
              />
              <label
                className={styles.floatingLabel}
                aria-required="true"
                htmlFor={undefined}
              >
                Password
              </label>
            </div>
            {shouldShowError("password") && (
              <p className={styles.errorText}>{currentErrors.password}</p>
            )}
          </div>

          <div className={styles.inputWrapper} style={{ flex: 1 }}>
            <div className={styles.floatingLabelGroup}>
              <input
                type="password"
                name="passwordConfirm"
                placeholder=" "
                value={form.passwordConfirm}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="new-password"
                aria-invalid={!!shouldShowError("passwordConfirm")}
                className={`${styles.inputField} ${
                  shouldShowError("passwordConfirm") ? styles.inputError : ""
                } ${shouldShowError("password") ? styles.inputError : ""}`}
              />
              <label
                className={styles.floatingLabel}
                aria-required="true"
                htmlFor={undefined}
              >
                Confirm Password
              </label>
            </div>
            {shouldShowError("passwordConfirm") && (
              <p className={styles.errorText}>
                {currentErrors.passwordConfirm}
              </p>
            )}
          </div>
        </div>

        {/* ✅ Password strength (visual only) */}
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

      {errors.global && (
        <div className={styles.errorBox}>
          <p>{errors.global}</p>
        </div>
      )}

      <div className={styles.buttonGroup}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={submitAttempted && Object.keys(currentErrors).length > 0}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        <p>
          <button type="button" onClick={onSwap} className={styles.switchLink}>
            Already have an account? Log In
          </button>
        </p>
      </div>
    </form>
  );
}
