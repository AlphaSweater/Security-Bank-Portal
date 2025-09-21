import reactLogo from "../assets/react.svg";
import styles from "./Landing.module.css";
import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();
  return (
    <section className={styles.page}>
      <img src={reactLogo} alt="React logo" className={styles.heroLogo} />
      <h1 className={styles.heading}>Security Bank Portal</h1>
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
