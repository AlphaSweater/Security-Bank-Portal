// External Dependencies
import { useNavigate } from "react-router-dom";

// Assets
import reactLogo from "../assets/react.svg";

// Styles
import styles from "./Landing.module.css";

function Landing() {
  const navigate = useNavigate();
  return (
    <section className={styles.page}>
      {/* ===== Hero Logo ===== */}
      <img src={reactLogo} alt="React logo" className={styles.heroLogo} />

      {/* ===== Heading ===== */}
      <h1 className={styles.heading}>Security Bank Portal</h1>

      {/* ===== Get Started Button ===== */}
      <button
        className={styles.getStartedBtn}
        onClick={() => navigate("/login")}
      >
        Get Started
      </button>
    </section>
  );
}

export default Landing;
