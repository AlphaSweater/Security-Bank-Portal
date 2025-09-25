// External Dependencies
import { useState } from "react";

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
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear only the error for the field being changed
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({}); // clear errors

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message === "Validation error") {
          setErrors(data.errors || {});
        } else {
          setErrors({ global: data.message || "Login failed" });
        }
        return;
      }

      window.location.reload();
    } catch (err) {
      console.error(err);
      setErrors({ global: "Network error. Please try again." });
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
              errors.email ? styles.inputError : ""
            }`}
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          {errors.email && <p className={styles.errorText}>{errors.email}</p>}
        </div>

        <div className={styles.inputWrapper}>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className={`${styles.inputField} ${
              errors.password ? styles.inputError : ""
            }`}
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
          {errors.password && (
            <p className={styles.errorText}>{errors.password}</p>
          )}
        </div>
      </div>

      <div className={styles.spacer} />
      <div className={styles.buttonGroup}>
        {errors.global && <p className={styles.errorText}>{errors.global}</p>}
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
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    saIdNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear only the error for the field being changed
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // reset errors
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message === "Validation error") {
          setErrors(data.errors || {});
        } else {
          setErrors({ global: data.message || "Registration failed" });
        }
        return;
      }

      window.location.reload();
    } catch (err) {
      console.error(err);
      setErrors({ global: "Network error. Please try again." });
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
                errors.firstName ? styles.inputError : ""
              }`}
              value={formData.firstName}
              onChange={handleChange}
              required
              autoComplete="given-name"
            />
            {errors.firstName && (
              <p className={styles.errorText}>{errors.firstName}</p>
            )}
          </div>

          <div className={styles.inputWrapper}>
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className={`${styles.inputField} ${
                errors.lastName ? styles.inputError : ""
              }`}
              value={formData.lastName}
              onChange={handleChange}
              required
              autoComplete="family-name"
            />
            {errors.lastName && (
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
              errors.email ? styles.inputError : ""
            }`}
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          {errors.email && <p className={styles.errorText}>{errors.email}</p>}
        </div>

        <div className={styles.inputWrapper}>
          <input
            type="text"
            name="saIdNumber"
            placeholder="SA ID Number"
            className={`${styles.inputField} ${
              errors.saIdNumber ? styles.inputError : ""
            }`}
            value={formData.saIdNumber}
            onChange={handleChange}
            required
          />
          {errors.saIdNumber && (
            <p className={styles.errorText}>{errors.saIdNumber}</p>
          )}
        </div>

        <div className={styles.inputRow}>
          <div className={styles.inputWrapper}>
            <input
              type="password"
              name="password"
              placeholder="Password"
              className={`${styles.inputField} ${
                errors.password ? styles.inputError : ""
              }`}
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            {errors.password && (
              <p className={styles.errorText}>{errors.password}</p>
            )}
          </div>

          <div className={styles.inputWrapper}>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              className={`${styles.inputField} ${
                errors.confirmPassword ? styles.inputError : ""
              }`}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className={styles.errorText}>{errors.confirmPassword}</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        {errors.global && (
          <div className={styles.globalError}>{errors.global}</div>
        )}
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
