// External Dependencies

import { AlertCircle } from "lucide-react";
import styles from "../AuthForms/AuthForms.module.css";

function ErrorList({ errors }) {
  if (!Array.isArray(errors) || errors.length === 0) return null;
  return (
    <ul className={styles.errorList}>
      {errors.map((err, idx) => (
        <li
          key={idx}
          style={{ display: "flex", alignItems: "flex-start", gap: "0.4em" }}
        >
          <span>•</span>
          <span className={styles.errorText}>{err}</span>
        </li>
      ))}
    </ul>
  );
}

export default ErrorList;
