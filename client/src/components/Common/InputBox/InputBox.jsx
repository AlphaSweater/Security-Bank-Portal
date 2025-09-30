// External Dependencies
import { forwardRef, useState, useEffect } from 'react';

// Styles
import styles from './InputBox.module.css';

const InputBox = forwardRef(({
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  label,
  required = false,
  error,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlurEvent = (e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  const labelClasses = [
    styles.floatingLabel,
    isFocused || hasValue ? styles.labelFloating : ''
  ].join(' ');

  return (
    <div className={styles.inputContainer}>
      <div className={styles.inputWrapper}>
        <input
          ref={ref}
          type={type}
          name={name}
          id={name}
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlurEvent}
          className={`${styles.input} ${error ? styles.error : ''}`}
          placeholder={!value && !isFocused ? ' ' : undefined}
          required={required}
          {...props}
        />
        {label && (
          <label 
            htmlFor={name} 
            className={labelClasses}
            aria-required={required}
          >
            {label}
            {required && <span className={styles.requiredIndicator}>*</span>}
          </label>
        )}
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});

InputBox.displayName = 'InputBox';

export default InputBox;