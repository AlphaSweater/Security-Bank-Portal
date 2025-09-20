import { useState } from "react";
import styles from "./LoginRegister.module.css";
import LoginForm from "../components/Auth/LoginForm";
import RegisterForm from "../components/Auth/RegisterForm";

function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [direction, setDirection] = useState("left"); // 'left' or 'right'

  const handleSwap = () => {
    setDirection(isLogin ? "left" : "right");
    setIsLogin((v) => !v);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>{isLogin ? "🔑 Login" : "📝 Register"}</h1>
      <div className={styles.formStack}>
        <div
          className={`${styles.formFade} ${
            isLogin
              ? direction === "left"
                ? styles.activeLeft
                : styles.activeRight
              : direction === "left"
              ? styles.inactiveLeft
              : styles.inactiveRight
          }`}
        >
          <LoginForm />
        </div>
        <div
          className={`${styles.formFade} ${
            !isLogin
              ? direction === "left"
                ? styles.activeLeft
                : styles.activeRight
              : direction === "left"
              ? styles.inactiveLeft
              : styles.inactiveRight
          }`}
        >
          <RegisterForm />
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <button
          type="button"
          onClick={handleSwap}
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
    </div>
  );
}

export default LoginRegister;
