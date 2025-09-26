// External Imports
import { useForm } from "./useForm";

// Internal Imports
import { apiRequest } from "../../utils/apiUtil";
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

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ResponseBox({ type, message }) {
  if (!message) return null;
  let color;
  if (type === "success") color = "#10b981";
  else if (type === "error") color = "#e63946";
  else color = "#2563eb";
  return (
    <div
      style={{
        border: `1.5px solid ${color}`,
        background: `${
          type === "success"
            ? "#e6f9f0"
            : type === "error"
            ? "#fde8e8"
            : "#e7f0fd"
        }`,
        color,
        borderRadius: 6,
        padding: "0.75em 1em",
        marginBottom: 16,
        fontWeight: 500,
        fontSize: "1em",
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}

function LoginForm({ onSwap }) {
  const [response, setResponse] = useState({ type: null, message: "" });
  const navigate = useNavigate();
  // Custom hook usage
  const {
    form,
    setErrors,
    loading,
    setLoading,
    submitAttempted,
    setSubmitAttempted,
    currentErrors,
    handleChange,
    handleBlur,
    shouldShowError,
  } = useForm({ email: "", password: "" }, (values) => {
    const { error } = loginUserSchema.validate(values, { abortEarly: false });
    if (!error) return {};
    return error.details.reduce(
      (acc, d) => ({ ...acc, [d.path[0]]: d.message }),
      {}
    );
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);
    setResponse({ type: null, message: "" });

    // Run validation on submit to ensure all errors are caught
    const { error } = loginUserSchema.validate(form, { abortEarly: false });
    const submitErrors = error
      ? error.details.reduce(
          (acc, d) => ({ ...acc, [d.path[0]]: d.message }),
          {}
        )
      : {};
    setErrors(submitErrors);
    if (Object.keys(submitErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setResponse({
        type: "success",
        message: data?.message || "Login successful!",
      });
      // Navigate to dashboard after successful login
      setTimeout(() => {
        navigate("/dashboard");
      }, 500); // short delay to show success message
    } catch (err) {
      if (err?.response && err.response.message) {
        setResponse({ type: "error", message: err.response.message });
      } else if (err?.message) {
        setResponse({ type: "error", message: err.message });
      } else {
        setResponse({
          type: "other",
          message: "An unexpected error occurred.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.formBox} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>Log In</h2>

      <ResponseBox type={response.type} message={response.message} />

      <div className={styles.inputGroup}>
        <div className={styles.inputWrapper}>
          <div className={styles.floatingLabelGroup}>
            <input
              type="email"
              name="email"
              id="login-email"
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
              htmlFor="login-email"
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
              id="login-password"
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
              htmlFor="login-password"
            >
              Password
            </label>
          </div>
          {shouldShowError("password") && (
            <p className={styles.errorText}>{currentErrors.password}</p>
          )}
        </div>
      </div>

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
  const [response, setResponse] = useState({ type: null, message: "" });
  const {
    form,
    setErrors,
    loading,
    setLoading,
    submitAttempted,
    setSubmitAttempted,
    currentErrors,
    handleChange,
    handleBlur,
    shouldShowError,
  } = useForm(
    {
      firstName: "",
      lastName: "",
      email: "",
      saIdNumber: "",
      password: "",
      passwordConfirm: "",
    },
    (values) => {
      const { error } = registerUserSchema.validate(values, {
        abortEarly: false,
      });
      if (!error) return {};
      return error.details.reduce(
        (acc, d) => ({ ...acc, [d.path[0]]: d.message }),
        {}
      );
    }
  );

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
    setResponse({ type: null, message: "" });

    // Run validation on submit to ensure all errors are caught
    const { error } = registerUserSchema.validate(form, { abortEarly: false });
    const submitErrors = error
      ? error.details.reduce(
          (acc, d) => ({ ...acc, [d.path[0]]: d.message }),
          {}
        )
      : {};
    setErrors(submitErrors);
    if (Object.keys(submitErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setResponse({
        type: "success",
        message: data?.message || "Registration successful!",
      });
      // Switch to login form after successful signup
      setTimeout(() => {
        onSwap();
      }, 500); // short delay to show success message
    } catch (err) {
      if (err?.response && err.response.message) {
        setResponse({ type: "error", message: err.response.message });
      } else if (err?.message) {
        setResponse({ type: "error", message: err.message });
      } else {
        setResponse({
          type: "other",
          message: "An unexpected error occurred.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.formBox} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>Sign Up</h2>

      <ResponseBox type={response.type} message={response.message} />

      <div className={styles.inputGroup}>
        <div className={styles.inputRow}>
          <div className={styles.inputWrapper}>
            <div className={styles.floatingLabelGroup}>
              <input
                type="text"
                name="firstName"
                id="register-firstName"
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
                htmlFor="register-firstName"
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
                id="register-lastName"
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
                htmlFor="register-lastName"
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
              id="register-email"
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
              htmlFor="register-email"
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
              id="register-saIdNumber"
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
              htmlFor="register-saIdNumber"
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
                id="register-password"
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
                htmlFor="register-password"
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
                id="register-passwordConfirm"
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
                htmlFor="register-passwordConfirm"
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
