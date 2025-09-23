// External Dependencies
import { useState } from "react";

// Assets

// Styles
import styles from "./AuthForms.module.css";

// Default Function Export
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

// Login Form Component
function LoginForm({ onSwap }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add login logic
  };

  return (
    <form className={styles.formBox} onSubmit={handleSubmit}>
      <h2 className={styles.heading}>Log In</h2>
      <div className={styles.inputGroup}>
        <input
          type="email"
          placeholder="Email"
          className={styles.inputField}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className={styles.inputField}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className={styles.spacer} />
      <div className={styles.buttonGroup}>
        <button type="submit" className={styles.primaryButton}>
          Log In
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

// Register Form Component
function RegisterForm({ onSwap }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [saIdNumber, setSaIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add register logic
  };

  return (
    <form className={styles.formBox} onSubmit={handleSubmit}>
      <h2 className={styles.heading}>Sign Up</h2>
      <div className={styles.inputGroup}>
        <div className={styles.inputRow}>
          <input
            type="text"
            placeholder="First Name"
            className={styles.inputField}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            className={styles.inputField}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <input
          type="email"
          placeholder="Email"
          className={styles.inputField}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="SA ID Number"
          className={styles.inputField}
          value={saIdNumber}
          onChange={(e) => setSaIdNumber(e.target.value)}
          required
        />
        <div className={styles.inputRow}>
          <input
            type="password"
            placeholder="Password"
            className={styles.inputField}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className={styles.inputField}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
      </div>
      <div className={styles.buttonGroup}>
        <button type="submit" className={styles.primaryButton}>
          Sign Up
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
