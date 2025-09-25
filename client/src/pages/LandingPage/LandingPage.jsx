// External Dependencies
import { useNavigate } from "react-router-dom";

// Assets
import reactLogo from "../../assets/react.svg";

// Styles
import styles from "./LandingPage.module.css";

function LandingPage() {
  const navigate = useNavigate();
  return (
    <section className={styles.page}>
      <img src={reactLogo} alt="React logo" className={styles.heroLogo} />

      <h1 className={styles.heading}>Security Bank Portal</h1>

      <button
        className={`btn ${styles.getStartedBtn}`}
        onClick={() => navigate("/auth")}
      >
        Get Started
      </button>
    </section>
  );
}

export default LandingPage;
