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
    if (!onChange) return;
    
    // If we get a direct value (not an event), create a synthetic event
    if (typeof e !== 'object' || !e.target) {
      e = { target: { name, value: e } };
    }
    
    // Ensure the name is set from props if not in the event
    if (!e.target.name && name) {
      e.target.name = name;
    }
    
    // Pass the event to the parent
    onChange(e);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlurEvent = (e) => {
    setIsFocused(false);
    if (onBlur) {
      // Ensure the event has the name property
      if (e && !e.target.name && name) {
        e.target = e.target || {};
        e.target.name = name;
      }
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