// External Dependencies
import { useState } from "react";

// Assets

// Styles
import styles from "./AuthForms.module.css";

// Default Function Export
export default function AuthForms({ isLogin, onSwap }) {
  return (
    <div className={styles.authForms}>
      <div className={styles.formContainer}>
        {isLogin ? (
          <LoginForm onSwap={onSwap} />
        ) : (
          <RegisterForm onSwap={onSwap} />
        )}
      </div>
    </div>
  );
}

// Login Form Component
function LoginForm({ onSwap }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add login logic
  };

  return (
    <>
      <h1 className={styles.heading}>🔑 Login</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className={styles.button}>
          Login
        </button>
      </form>
      <div style={{ marginTop: 18 }}>
        <button
          type="button"
          onClick={onSwap}
          style={{
            background: "none",
            border: "none",
            color: "#b8c1ec",
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: 15,
            marginTop: 8,
          }}
        >
          {"Don't have an account? Register"}
        </button>
      </div>
    </>
  );
}

// Register Form Component
function RegisterForm({ onSwap }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add register logic
  };

  return (
    <>
      <h1 className={styles.heading}>📝 Register</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className={styles.input}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button type="submit" className={styles.button}>
          Register
        </button>
      </form>
      <div style={{ marginTop: 18 }}>
        <button
          type="button"
          onClick={onSwap}
          style={{
            background: "none",
            border: "none",
            color: "#b8c1ec",
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: 15,
            marginTop: 8,
          }}
        >
          {"Already have an account? Login"}
        </button>
      </div>
    </>
  );
}
