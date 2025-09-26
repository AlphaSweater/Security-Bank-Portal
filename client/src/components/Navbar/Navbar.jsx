// External Dependencies
import React, { useState, useRef, useEffect } from "react";
import { FiMenu, FiX, FiUser } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import routes from "../../routing/routes";

// Assets

// Styles
import styles from "./Navbar.module.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Logout handler
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Optionally handle error, but always redirect
    }
    navigate("/");
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>🏦 Bank Portal</div>

      <button
        className={styles.mobileToggle}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <FiX /> : <FiMenu />}
      </button>

      <ul className={`${styles.navLinks} ${menuOpen ? styles.open : ""}`}>
        {routes
          .filter((route) => route.showInNav)
          .map((route) => (
            <li key={route.path}>
              <Link to={route.path}>{route.label}</Link>
            </li>
          ))}
      </ul>

      <div
        className={styles.profile}
        ref={dropdownRef}
        tabIndex={-1}
        onBlur={() => setDropdownOpen(false)}
      >
        <button
          className={styles.avatarBtn}
          onClick={() => setDropdownOpen((open) => !open)}
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          <FiUser />
        </button>
        <div
          className={
            dropdownOpen
              ? `${styles.dropdown} ${styles.dropdownOpen}`
              : styles.dropdown
          }
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <a href="#">Profile</a>
          <a href="#">Preferences</a>
          <a href="#" onMouseDown={handleLogout}>
            Logout
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
