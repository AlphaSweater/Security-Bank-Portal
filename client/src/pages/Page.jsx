import styles from "./Page.module.css";
import reactLogo from "../assets/react.svg";

export default function Page() {
  return (
    <div className={styles.page}>
      <img src={reactLogo} alt="React logo" className={styles.heroLogo} />
    </div>
  );
}
