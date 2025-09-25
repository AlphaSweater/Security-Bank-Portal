// External Dependencies
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Assets
import reactLogo from "../../assets/react.svg";

// Styles
import styles from "./LandingPage.module.css";

function LandingPage() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  const handleGetStarted = () => {
    setFadeOut(true);
    setTimeout(() => {
      navigate("/auth");
    }, 350); // match CSS transition duration
  };

  return (
    <section className={`${styles.page} ${fadeOut ? styles.fadeOut : ""}`}>
      <img src={reactLogo} alt="React logo" className={styles.heroLogo} />

      <h1 className={styles.heading}>Security Bank Portal</h1>

      <button
        className={`btn ${styles.getStartedBtn}`}
        onClick={handleGetStarted}
        disabled={fadeOut}
      >
        Get Started
      </button>
    </section>
  );
}

export default LandingPage;
