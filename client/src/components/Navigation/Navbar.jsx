import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";

function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        {/* Replace with your logo if available */}
        <span>🏦 Bank Portal</span>
      </div>
      <ul className={styles.navLinks}>
        <li>
          <Link to="/" className={styles.link}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/login" className={styles.link}>
            Login/Register
          </Link>
        </li>
        <li>
          <Link to="/dashboard" className={styles.link}>
            Dashboard
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
