// External Dependencies
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";

// Assets

// Styles
import styles from "./Navbar.module.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>MyApp</div>

      <button
        className={styles.mobileToggle}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <FiX /> : <FiMenu />}
      </button>

      <ul className={`${styles.navLinks} ${menuOpen ? styles.open : ""}`}>
        <li>
          <a href="#">Home</a>
        </li>
        <li>
          <a href="#">Features</a>
        </li>
        <li>
          <a href="#">Pricing</a>
        </li>
        <li>
          <a href="#">About</a>
        </li>
      </ul>

      <div className={styles.actions}>
        <button className={styles.loginBtn}>Login</button>
        <button className={styles.signupBtn}>Sign Up</button>
      </div>
    </nav>
  );
}

export default Navbar;
