import React from 'react';
import PropTypes from 'prop-types';
import styles from './Button.module.css';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    fullWidth ? styles['button--fullWidth'] : '',
    className,
  ].join(' ').trim();

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.button__loading}>
          <span className={styles.button__spinner} />
          <span className="sr-only">Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'text', 'outline', 'danger']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;
