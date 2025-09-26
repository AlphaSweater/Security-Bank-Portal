import { useState } from "react";

/**
 * Custom hook for form state, validation, and error handling.
 * @param {object} initialValues - Initial form values
 * @param {function} validate - Validation function, returns error object
 * @returns {object} Form state and handlers
 */
export function useForm(initialValues, validate) {
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Get all errors from validation
  const allErrors = validate(form);

  // Only include 'required' errors after submitAttempted
  function filterErrors(errorsObj) {
    const filtered = {};
    for (const key in errorsObj) {
      const msg = errorsObj[key];
      // If not a required error, always include
      if (!/required/i.test(msg)) {
        filtered[key] = msg;
      } else if (submitAttempted) {
        // Only include required errors after submit
        filtered[key] = msg;
      }
    }
    return filtered;
  }
  const currentErrors = filterErrors(allErrors);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleBlur(e) {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
  }

  function shouldShowError(field) {
    return currentErrors[field] && (touched[field] || submitAttempted);
  }

  return {
    form,
    setForm,
    errors,
    setErrors,
    touched,
    setTouched,
    loading,
    setLoading,
    submitAttempted,
    setSubmitAttempted,
    currentErrors,
    handleChange,
    handleBlur,
    shouldShowError,
  };
}
