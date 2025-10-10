import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import styles from "./Dropdown.module.css";

const Dropdown = ({
  id,
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select an option",
  disabled = false,
  error = "",
  className = "",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  // Close dropdown when clicking outside (use 'click' so option onClick fires first)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Position the menu under the button (viewport coordinates)
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const updatePos = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom, left: rect.left, width: rect.width });
    };
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  return (
    <div
      className={`${styles.dropdownContainer} ${className}`}
      ref={dropdownRef}
    >
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.dropdownWrapper}>
        <button
          type="button"
          id={id}
          className={`${styles.dropdownButton} ${error ? styles.error : ""} ${
            disabled ? styles.disabled : ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
              setIsOpen(!isOpen);
            }
          }}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={!!error}
          ref={buttonRef}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "0.75rem 1rem",
            background: "var(--color-surface-solid)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-primary)",
            cursor: "pointer",
            textAlign: "left",
            fontSize: "1rem",
            lineHeight: "1.5",
          }}
          {...props}
        >
          <span className={styles.selectedValue}>{displayValue}</span>
          <svg
            className={`${styles.arrow} ${isOpen ? styles.arrowUp : ""}`}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              flexShrink: 0,
              marginLeft: "0.5rem",
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen &&
          createPortal(
            <div
              className={styles.dropdownMenu}
              role="listbox"
              style={{
                position: "fixed",
                top: `${menuPos.top}px`,
                left: `${menuPos.left}px`,
                width: `${menuPos.width}px`,
                zIndex: 10000,
              }}
            >
              {options.map((option) => (
                <div
                  key={option.value}
                  className={`${styles.dropdownItem} ${
                    value === option.value ? styles.selected : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                  role="option"
                  aria-selected={value === option.value}
                  style={{ padding: "0.5rem 1rem" }}
                >
                  {option.label}
                </div>
              ))}
              {options.length === 0 && (
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    color: "var(--color-text-muted)",
                    fontStyle: "italic",
                  }}
                >
                  No options available
                </div>
              )}
            </div>,
            document.body
          )}
      </div>
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};

Dropdown.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
};

export default Dropdown;
