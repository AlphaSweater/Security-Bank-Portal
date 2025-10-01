// External Imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Components
import InputBox from "../Common/InputBox/InputBox";
import Button from "../Common/Button/Button";

// Internal Imports
import { useForm } from "./useForm";
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
        <InputBox
          type="email"
          name="email"
          label="Email Address"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shouldShowError("email") ? currentErrors.email : undefined}
          required
          autoComplete="email"
        />

        <InputBox
          type="password"
          name="password"
          label="Password"
          value={form.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shouldShowError("password") ? currentErrors.password : undefined}
          required
          autoComplete="current-password"
        />
      </div>

      <div className={styles.buttonGroup}>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          disabled={submitAttempted && Object.keys(currentErrors).length > 0}
        >
          {loading ? "Logging in..." : "Log In"}
        </Button>
        <p>
          <Button 
            type="button" 
            variant="text" 
            onClick={onSwap} 
            className={styles.switchLink}
          >
            Need an account? Sign Up
          </Button>
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
          <InputBox
            type="text"
            name="firstName"
            label="First Name"
            value={form.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={shouldShowError("firstName") ? currentErrors.firstName : undefined}
            required
            autoComplete="given-name"
          />

          <InputBox
            type="text"
            name="lastName"
            label="Last Name"
            value={form.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={shouldShowError("lastName") ? currentErrors.lastName : undefined}
            required
            autoComplete="family-name"
          />
        </div>

        <InputBox
          type="email"
          name="email"
          label="Email Address"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shouldShowError("email") ? currentErrors.email : undefined}
          required
          autoComplete="email"
        />

        <InputBox
          type="text"
          name="saIdNumber"
          label="SA ID Number"
          value={form.saIdNumber}
          onChange={handleChange}
          error={shouldShowError("saIdNumber") ? currentErrors.saIdNumber : undefined}
          required
        />

        <InputBox
          type={showPassword ? "text" : "password"}
          name="password"
          label="Password"
          value={form.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shouldShowError("password") ? currentErrors.password : undefined}
          required
          autoComplete="new-password"
          rightIcon={{
            icon: showPassword ? "🙈" : "👁️",
            onClick: () => setShowPassword(!showPassword),
            label: showPassword ? "Hide password" : "Show password"
          }}
        />
        {!shouldShowError("password") && form.password && (
          <div className={styles.passwordStrength}>
            <div
              className={styles.strengthBar}
              style={{
                width: `${(passwordStrength / 5) * 100}%`,
                background: passwordStrength <= 1 
                  ? "#e63946" 
                  : passwordStrength <= 3 
                    ? "#fbbf24" 
                    : "#10b981"
              }}
            />
            <div className={styles.passwordStrengthLabel}>
              {passwordStrength <= 1 
                ? "Weak" 
                : passwordStrength <= 3 
                  ? "Okay" 
                  : "Strong"
              }
            </div>
          </div>
        )}

        <InputBox
          type={showConfirmPassword ? "text" : "password"}
          name="passwordConfirm"
          label="Confirm Password"
          value={form.passwordConfirm}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shouldShowError("passwordConfirm") ? currentErrors.passwordConfirm : undefined}
          required
          autoComplete="new-password"
          rightIcon={{
            icon: showConfirmPassword ? "🙈" : "👁️",
            onClick: () => setShowConfirmPassword(!showConfirmPassword),
            label: showConfirmPassword ? "Hide password" : "Show password"
          }}
        />
      </div>

      <div className={styles.buttonGroup}>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          disabled={submitAttempted && (Object.keys(currentErrors).length > 0 || !form.termsAndConditions || passwordStrength < 3)}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </Button>
        <p>
          <Button 
            type="button" 
            variant="text" 
            onClick={onSwap} 
            className={styles.switchLink}
          >
            Already have an account? Log In
          </Button>
        </p>
      </div>
    </form>
  );
}
