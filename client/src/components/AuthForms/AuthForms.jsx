// External Dependencies
import { useState } from "react";

// Assets

// Styles
import styles from "./AuthForms.module.css";

// Default Function Export
export default function AuthForms({ isLogin, onSwap }) {
  return (
    <div className={styles.authForms}>
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
    <form className={`${styles.form} ${styles.active}`} onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        className={styles.formControl}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className={styles.formControl}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" className={styles.btn}>
        Log In
      </button>
      <p className={styles.textCenter}>
        <button
          type="button"
          onClick={onSwap}
          className={styles.switchLink}
          style={{ background: "none", border: "none", padding: 0 }}
        >
          Need an account? Sign Up Here!
        </button>
      </p>
    </form>
  );
}

// Register Form Component
function RegisterForm({ onSwap }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add register logic
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <input
          type="text"
          placeholder="First Name"
          className={styles.formControl}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          className={styles.formControl}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      <input
        type="email"
        placeholder="Email"
        className={styles.formControl}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div className={styles.row}>
        <input
          type="password"
          placeholder="Password"
          className={styles.formControl}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className={styles.formControl}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      <button type="submit" className={styles.btn}>
        Sign Up
      </button>
      <p className={styles.textCenter}>
        <button
          type="button"
          onClick={onSwap}
          className={styles.switchLink}
          style={{ background: "none", border: "none", padding: 0 }}
        >
          Already have an account? Log In
        </button>
      </p>
    </form>
  );
}
