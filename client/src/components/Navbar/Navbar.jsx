// External Dependencies
import React, { useState, useRef, useEffect } from "react";
import { FiMenu, FiX, FiUser } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../utils/apiUtil";
import routes from "../../routing/routes";

// Assets

// Styles
import styles from "./Navbar.module.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const menuItemsRef = useRef([]);
  const navigate = useNavigate();
  const CLOSE_DELAY_MS = 2000; // Delay before closing after pointer leaves

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

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dropdownOpen]);

  // Helpers to avoid janky close on tiny pointer leave
  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openDropdown = () => {
    clearCloseTimeout();
    setDropdownOpen(true);
    // focus first item shortly after open for keyboard users
    requestAnimationFrame(() => {
      menuItemsRef.current?.[0]?.focus?.();
    });
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(
      () => setDropdownOpen(false),
      CLOSE_DELAY_MS
    );
  };

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
        onMouseEnter={clearCloseTimeout}
        onMouseLeave={scheduleClose}
      >
        <button
          className={styles.avatarBtn}
          onClick={() =>
            dropdownOpen ? setDropdownOpen(false) : openDropdown()
          }
          aria-haspopup="menu"
          aria-expanded={dropdownOpen}
          aria-controls="profile-menu"
        >
          <FiUser />
        </button>
        <div
          id="profile-menu"
          className={
            dropdownOpen
              ? `${styles.dropdown} ${styles.dropdownOpen}`
              : styles.dropdown
          }
          role="menu"
          aria-label="Profile menu"
          onKeyDown={(e) => {
            const items = menuItemsRef.current.filter(Boolean);
            const currentIndex = items.indexOf(document.activeElement);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const next = items[(currentIndex + 1) % items.length] || items[0];
              next?.focus();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const prevIndex =
                (currentIndex - 1 + items.length) % items.length;
              const prev = items[prevIndex] || items[items.length - 1];
              prev?.focus();
            } else if (e.key === "Home") {
              e.preventDefault();
              items[0]?.focus();
            } else if (e.key === "End") {
              e.preventDefault();
              items[items.length - 1]?.focus();
            }
          }}
        >
          <button
            type="button"
            className={styles.dropdownItem}
            role="menuitem"
            ref={(el) => (menuItemsRef.current[0] = el)}
          >
            Profile
          </button>
          <button
            type="button"
            className={styles.dropdownItem}
            role="menuitem"
            ref={(el) => (menuItemsRef.current[1] = el)}
          >
            Preferences
          </button>
          <button
            type="button"
            className={styles.dropdownItem}
            role="menuitem"
            onClick={handleLogout}
            ref={(el) => (menuItemsRef.current[2] = el)}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
