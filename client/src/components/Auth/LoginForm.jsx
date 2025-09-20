import { useState } from "react";
import styles from "./Auth.module.css";

export default function LoginForm({ onSwap, isLogin }) {
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
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </button>
      </div>
    </>
  );
}
