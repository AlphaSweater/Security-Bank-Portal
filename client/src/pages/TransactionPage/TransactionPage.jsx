import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Common/Button/Button";
import Dropdown from "../../components/Common/Dropdown/Dropdown";
import styles from "./TransactionPage.module.css";
import Notification from "../../components/Common/Notification/Notification";
import { apiRequest } from "../../utils/apiUtil";
import { createTransactionSchema } from "../../utils/validation/transactionValidation";

// -----------------------------------------------------------------------------
// Constants and helpers (outside component for clarity)
// -----------------------------------------------------------------------------
const exchangeRates = {
  USD: { EUR: 0.94, GBP: 0.82, JPY: 149.5, CAD: 1.36, AUD: 1.55, ZAR: 18.75 },
  EUR: { USD: 1.06, GBP: 0.87, JPY: 159.2, CAD: 1.45, AUD: 1.65, ZAR: 19.95 },
  GBP: { USD: 1.22, EUR: 1.15, JPY: 183.5, CAD: 1.66, AUD: 1.89, ZAR: 22.9 },
  JPY: {
    USD: 0.0067,
    EUR: 0.0063,
    GBP: 0.0055,
    CAD: 0.0091,
    AUD: 0.0103,
    ZAR: 0.125,
  },
  CAD: { USD: 0.74, EUR: 0.69, GBP: 0.6, JPY: 110.5, AUD: 1.14, ZAR: 13.8 },
  AUD: { USD: 0.65, EUR: 0.61, GBP: 0.53, JPY: 97.2, CAD: 0.88, ZAR: 12.1 },
  ZAR: { USD: 0.053, EUR: 0.05, GBP: 0.044, JPY: 8.0, CAD: 0.072, AUD: 0.083 },
};

const currencyOptions = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "ZAR", label: "South African Rand (ZAR)" },
];

const countryOptions = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "ZA", label: "South Africa" },
];

const currencySymbols = {
  ZAR: "R",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "$",
  AUD: "$",
};
const getCurrencySymbol = (code) => currencySymbols[code] || code;
const getCountryName = (code) =>
  countryOptions.find((c) => c.value === code)?.label || code;

const TransactionPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  // Options are declared at module scope for clarity

  const [formData, setFormData] = useState({
    // Step 1: Amount & Currency
    amount: "",
    currency: "ZAR",
    // Step 2: Beneficiary
    beneficiaryType: "individual", // 'individual' or 'business'
    beneficiaryName: "",
    message: "",
    // Step 3: Bank & Account
    destinationCountry: "",
    bankName: "",
    swiftBic: "",
    accountNumber: "",
    // Step 4: Review
    agreeTerms: false,
  });

  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({}); // Joi error messages by API field key
  const [touched, setTouched] = useState({}); // Track per-field interaction (by API key)
  const [stepAttempted, setStepAttempted] = useState(false); // User tried to move forward

  // Map UI fields to API schema fields
  const mapUiToApi = (fd) => ({
    amount: fd.amount ? parseFloat(fd.amount) : undefined,
    currencyCode: fd.currency,
    beneficiaryType:
      fd.beneficiaryType === "business" ? "Business" : "Individual",
    beneficiaryFullName: fd.beneficiaryName,
    beneficiaryNote: fd.message || "",
    destinationCountryCode: fd.destinationCountry,
    destinationBankName: fd.bankName,
    destinationBankSwift: fd.swiftBic,
    destinationAccountNumber: fd.accountNumber,
    createdAtTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    // userId is injected server-side; do not send from client
  });

  // Validate against server schema with userId optional client-side
  const validateMapped = (mapped) => {
    const schema = createTransactionSchema.fork(["userId"], (s) =>
      s.optional()
    );
    const { error, value } = schema.validate(mapped, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (!error) return { errors: null, value };
    const details = error.details || [];
    const errMap = {};
    details.forEach((d) => {
      if (d.path && d.path.length) {
        const key = d.path[0];
        if (!errMap[key]) errMap[key] = d.message;
      }
    });
    return { errors: errMap, value };
  };

  // Re-run validation when inputs change
  const runValidation = (nextForm) => {
    const mapped = mapUiToApi(nextForm);
    const { errors: errMap } = validateMapped(mapped);
    setErrors(errMap || {});
  };

  // Map UI fields to API keys for touch tracking
  const uiFieldToApiKeys = (uiName) => {
    switch (uiName) {
      case "amount":
        return ["amount"];
      case "currency":
        return ["currencyCode"];
      case "beneficiaryType":
        return ["beneficiaryType"];
      case "beneficiaryName":
        return ["beneficiaryFullName"];
      case "message":
        return ["beneficiaryNote"];
      case "destinationCountry":
        return ["destinationCountryCode"];
      case "bankName":
        return ["destinationBankName"];
      case "swiftBic":
        return ["destinationBankSwift"];
      case "accountNumber":
        return ["destinationAccountNumber"];
      default:
        return [];
    }
  };

  const markTouched = (apiKeys = []) =>
    setTouched((prev) =>
      apiKeys.reduce((acc, k) => ({ ...acc, [k]: true }), prev)
    );

  const showError = (apiKey) =>
    !!(errors?.[apiKey] && (touched?.[apiKey] || stepAttempted));

  // Step-specific field lists in API schema keys
  const stepApiFields = {
    1: ["amount", "currencyCode"],
    2: ["beneficiaryType", "beneficiaryFullName", "beneficiaryNote"],
    3: [
      "destinationCountryCode",
      "destinationBankName",
      "destinationBankSwift",
      "destinationAccountNumber",
    ],
    4: ["createdAtTimeZone"],
  };

  const hasStepErrors = (step, mapped, errMap) => {
    // If not provided, compute current errors
    const currentErrs = errMap ?? validateMapped(mapped).errors ?? {};
    return stepApiFields[step].some((k) => currentErrs[k]);
  };

  // Format currency with symbol
  const formatCurrency = (amount, currencyCode) => {
    const currencySymbols = {
      ZAR: "R",
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "$",
      AUD: "$",
    };
    const symbol = currencySymbols[currencyCode] || currencyCode;
    const amountValue = parseFloat(amount) || 0;
    return `${symbol}${amountValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calculate converted amount based on destination country
  const getConvertedAmount = () => {
    if (!formData.amount || !formData.destinationCountry) return null;

    const countryToCurrency = {
      ZA: "ZAR",
      US: "USD",
      GB: "GBP",
      DE: "EUR",
      FR: "EUR",
      JP: "JPY",
      CA: "CAD",
      AU: "AUD",
    };

    const targetCurrency =
      countryToCurrency[formData.destinationCountry] || "EUR";

    // If source and target currencies are the same, no conversion needed
    if (formData.currency === targetCurrency) {
      return {
        amount: parseFloat(formData.amount) || 0,
        currency: targetCurrency,
        rate: 1,
        formattedAmount: formatCurrency(formData.amount || 0, targetCurrency),
        formattedRate: formatCurrency(1, targetCurrency),
      };
    }

    // Get the exchange rate from source to target currency
    const rate = exchangeRates[formData.currency]?.[targetCurrency];

    // If direct rate not found, try to find a path through USD
    let calculatedRate = rate;
    if (!rate && formData.currency !== "USD" && targetCurrency !== "USD") {
      const toUsdRate = exchangeRates[formData.currency]?.USD;
      const fromUsdRate = exchangeRates.USD?.[targetCurrency];
      if (toUsdRate && fromUsdRate) {
        calculatedRate = toUsdRate * fromUsdRate;
      }
    }

    // If still no rate, default to 1 (shouldn't happen with our currency set)
    if (!calculatedRate) {
      console.warn(
        `No exchange rate found from ${formData.currency} to ${targetCurrency}`
      );
      calculatedRate = 1;
    }

    const amount = parseFloat(formData.amount) * calculatedRate;

    return {
      amount: amount,
      currency: targetCurrency,
      rate: calculatedRate,
      inverseRate: 1 / calculatedRate,
      formattedAmount: formatCurrency(amount, targetCurrency),
      formattedRate: formatCurrency(calculatedRate, targetCurrency),
      formattedInverseRate: formatCurrency(
        1 / calculatedRate,
        formData.currency
      ),
    };
  };

  const convertedAmount = getConvertedAmount();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: "Amount & Currency",
      description: "Enter transfer amount",
    },
    { number: 2, title: "Beneficiary", description: "Recipient details" },
    { number: 3, title: "Bank & Account", description: "Bank information" },
    { number: 4, title: "Review & Confirm", description: "Verify all details" },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const next = {
      ...formData,
      [name]:
        type === "checkbox"
          ? checked
          : name === "swiftBic"
          ? value.toUpperCase()
          : value,
    };
    setFormData(next);
    runValidation(next);
    // mark field as touched on change
    markTouched(uiFieldToApiKeys(name));
  };

  // Handle dropdown changes
  const handleDropdownChange = (name) => (value) => {
    // Do not change source currency; it stays ZAR. Only update the selected field.
    const next = { ...formData, [name]: value };
    setFormData(next);
    runValidation(next);
    markTouched(uiFieldToApiKeys(name));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMakePayment = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    const payload = mapUiToApi(formData);

    // Validate entire payload before sending
    const { errors: errMap } = validateMapped(payload);
    if (errMap) {
      setErrors(errMap);
      // mark all errored fields as touched so they render
      markTouched(Object.keys(errMap));
      setStepAttempted(true);
      setIsSubmitting(false);
      setNotification({
        type: "error",
        message: "Please fix the highlighted fields.",
      });
      return;
    }

    try {
      const response = await apiRequest("/api/customers/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setNotification({
        type: "success",
        message: response.message || "Payment submitted successfully",
      });
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Failed to submit payment",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPayment = () => {
    setShowConfirmModal(false);
  };

  const isStepValid = (step) => {
    const mapped = mapUiToApi(formData);
    const { errors: errMap } = validateMapped(mapped);

    // Also ensure minimal UX requirements (like checkbox on step 4)
    const noErrors = !hasStepErrors(step, mapped, errMap || {});

    if (step === 4) return noErrors && formData.agreeTerms;
    return noErrors;
  };

  // Helper to render an inline error under fields (only when touched/attempted)
  const FieldError = ({ apiKey }) =>
    errors && showError(apiKey) ? (
      <div className={styles.errorText}>{errors[apiKey]}</div>
    ) : null;

  return (
    <div className={styles.transactionPage}>
      {/* Notification area */}
      {notification && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 1000 }}>
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        </div>
      )}
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1>International Transfer</h1>
        </div>

        {/* Step Indicators */}
        <div className={styles.stepper}>
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div
                className={`${styles.step} ${
                  currentStep === step.number ? styles.active : ""
                } ${currentStep > step.number ? styles.completed : ""}`}
              >
                <div className={styles.stepNumber}>
                  {currentStep > step.number ? "✓" : step.number}
                </div>
                <div className={styles.stepLabel}>
                  <div style={{ fontWeight: "600" }}>{step.title}</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`${styles.connector} ${
                    currentStep > step.number ? styles.completed : ""
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className={styles.formContainer}
        >
          <div className={styles.stepContent}>
            {currentStep === 1 && (
              <div>
                <h2>Amount & Currency</h2>
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    marginBottom: "2rem",
                  }}
                >
                  Enter the amount you want to transfer in Rand (ZAR).
                </p>

                <div className={styles.formGroup}>
                  <label
                    htmlFor="amount"
                    className={showError("amount") ? styles.labelError : ""}
                  >
                    Amount
                  </label>
                  <div className={styles.amountContainer}>
                    <div
                      className={`${styles.amountInput} ${
                        showError("amount") ? styles.inputError : ""
                      }`}
                    >
                      <div className={styles.currencySymbol}>
                        {getCurrencySymbol(formData.currency)}
                      </div>
                      <input
                        id="amount"
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        required
                        className={`${styles.amountField} ${
                          showError("amount") ? styles.inputError : ""
                        }`}
                        aria-label="Amount to transfer"
                        onBlur={() => markTouched(["amount"])}
                      />
                    </div>
                  </div>
                  <FieldError apiKey="amount" />
                </div>

                <div className={styles.formGroup}>
                  <div className={styles.providerBox}>
                    <div className={styles.providerContent}>
                      <div className={styles.providerIcon} aria-hidden="true">
                        {/* simple shield/lock icon */}
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9.5 12.5l2 2 3.5-3.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className={styles.providerLabel}>
                        Payment Provider:
                      </div>
                      <div className={styles.providerValue}>
                        <span className={styles.providerBadge}>SWIFT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2>Beneficiary Details</h2>
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    marginBottom: "2rem",
                  }}
                >
                  Enter the recipient's personal or business information.
                </p>

                <div className={styles.formGroup}>
                  <label
                    className={
                      showError("beneficiaryType") ? styles.labelError : ""
                    }
                  >
                    Beneficiary Type
                  </label>
                  <div
                    className={`${styles.segmentedControl} ${
                      showError("beneficiaryType")
                        ? styles.segmentedControlError
                        : ""
                    }`}
                  >
                    <Button
                      type="button"
                      variant={
                        formData.beneficiaryType === "individual"
                          ? "primary"
                          : "outline"
                      }
                      onClick={() => {
                        const next = {
                          ...formData,
                          beneficiaryType: "individual",
                        };
                        setFormData(next);
                        runValidation(next);
                        markTouched(["beneficiaryType"]);
                      }}
                      className={`${styles.segment} ${
                        formData.beneficiaryType === "individual"
                          ? styles.active
                          : ""
                      }`}
                    >
                      Individual
                    </Button>
                    <Button
                      type="button"
                      variant={
                        formData.beneficiaryType === "business"
                          ? "primary"
                          : "outline"
                      }
                      onClick={() => {
                        const next = {
                          ...formData,
                          beneficiaryType: "business",
                        };
                        setFormData(next);
                        runValidation(next);
                        markTouched(["beneficiaryType"]);
                      }}
                      className={`${styles.segment} ${
                        formData.beneficiaryType === "business"
                          ? styles.active
                          : ""
                      }`}
                    >
                      Business
                    </Button>
                  </div>
                  <FieldError apiKey="beneficiaryType" />
                </div>

                <div className={styles.formGroup}>
                  <label
                    htmlFor="beneficiaryName"
                    className={
                      showError("beneficiaryFullName") ? styles.labelError : ""
                    }
                  >
                    {formData.beneficiaryType === "individual"
                      ? "Full Name"
                      : "Business Name"}
                  </label>
                  <input
                    id="beneficiaryName"
                    type="text"
                    name="beneficiaryName"
                    value={formData.beneficiaryName}
                    onChange={handleChange}
                    placeholder={
                      formData.beneficiaryType === "individual"
                        ? "First and last name"
                        : "Legal business name"
                    }
                    required
                    className={`${styles.inputField} ${
                      showError("beneficiaryFullName") ? styles.inputError : ""
                    }`}
                    onBlur={() => markTouched(["beneficiaryFullName"])}
                  />
                  <FieldError apiKey="beneficiaryFullName" />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message">
                    Message to Beneficiary (Optional)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Add a message to the beneficiary"
                    rows="3"
                    className={styles.inputField}
                    style={{ resize: "vertical", minHeight: "80px" }}
                    maxLength={200}
                  />
                  <small style={{ color: "var(--color-text-muted)" }}>
                    Maximum 200 characters
                  </small>
                  <FieldError apiKey="beneficiaryNote" />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2>Bank & Account Details</h2>
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    marginBottom: "2rem",
                  }}
                >
                  Enter the recipient's bank information.
                </p>

                <div className={styles.formGroup}>
                  <label
                    htmlFor="destinationCountry"
                    className={
                      showError("destinationCountryCode")
                        ? styles.labelError
                        : ""
                    }
                  >
                    Destination Country
                  </label>
                  <Dropdown
                    id="destinationCountry"
                    value={formData.destinationCountry}
                    options={countryOptions}
                    onChange={handleDropdownChange("destinationCountry")}
                    placeholder="Select a country"
                    required
                    error={
                      showError("destinationCountryCode")
                        ? errors.destinationCountryCode
                        : ""
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label
                    htmlFor="bankName"
                    className={
                      showError("destinationBankName") ? styles.labelError : ""
                    }
                  >
                    Bank Name
                  </label>
                  <input
                    id="bankName"
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="Start typing to search bank"
                    required
                    className={`${styles.inputField} ${
                      showError("destinationBankName") ? styles.inputError : ""
                    }`}
                    list="bankSuggestions"
                    onBlur={() => markTouched(["destinationBankName"])}
                  />
                  <datalist id="bankSuggestions">
                    <option value="Chase Bank" />
                    <option value="Bank of America" />
                    <option value="Wells Fargo" />
                    <option value="Citibank" />
                    <option value="HSBC" />
                    <option value="Barclays" />
                    <option value="Deutsche Bank" />
                    <option value="BNP Paribas" />
                    <option value="Santander" />
                    <option value="UBS" />
                  </datalist>
                  <FieldError apiKey="destinationBankName" />
                </div>

                <div className={styles.formGroup}>
                  <label
                    htmlFor="swiftBic"
                    className={
                      showError("destinationBankSwift") ? styles.labelError : ""
                    }
                  >
                    SWIFT/BIC Code
                  </label>
                  <input
                    id="swiftBic"
                    type="text"
                    name="swiftBic"
                    value={formData.swiftBic}
                    onChange={handleChange}
                    placeholder="e.g., CHASUS33XXX"
                    required
                    className={`${styles.inputField} ${
                      showError("destinationBankSwift") ? styles.inputError : ""
                    }`}
                    style={{ textTransform: "uppercase" }}
                    maxLength={11}
                    onBlur={() => markTouched(["destinationBankSwift"])}
                  />
                  <small style={{ color: "var(--color-text-muted)" }}>
                    Must be a valid SWIFT/BIC code and must be in a valid format
                  </small>
                  <FieldError apiKey="destinationBankSwift" />
                </div>

                <div className={styles.formGroup}>
                  <label
                    htmlFor="accountNumber"
                    className={
                      showError("destinationAccountNumber")
                        ? styles.labelError
                        : ""
                    }
                  >
                    Account Number
                  </label>
                  <input
                    id="accountNumber"
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="Enter account number"
                    required
                    className={`${styles.inputField} ${
                      showError("destinationAccountNumber")
                        ? styles.inputError
                        : ""
                    }`}
                    inputMode="numeric"
                    onBlur={() => markTouched(["destinationAccountNumber"])}
                  />
                  <FieldError apiKey="destinationAccountNumber" />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2>Review & Confirm</h2>
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    marginBottom: "2rem",
                  }}
                >
                  Please review all details before confirming your transfer.
                </p>

                <h3 className={styles.reviewTitle}>Transfer Summary</h3>

                <div className={styles.reviewSummaryGrid}>
                  <div className={styles.reviewCol}>
                    <div
                      className={`${styles.summaryCard} ${styles.stretchCard}`}
                    >
                      <div className={styles.cardHeader}>Amounts</div>
                      <div className={styles.cardBody}>
                        <div className={styles.reviewGrid}>
                          <div className={styles.reviewItem}>
                            <span className={styles.reviewLabel}>You send</span>
                            <span
                              className={`${styles.reviewValue} ${styles.money}`}
                            >
                              {formatCurrency(
                                formData.amount || 0,
                                formData.currency
                              )}
                            </span>
                          </div>

                          {convertedAmount && (
                            <>
                              <div className={styles.reviewItem}>
                                <span className={styles.reviewLabel}>
                                  Recipient gets
                                </span>
                                <span
                                  className={`${styles.reviewValue} ${styles.emphasis}`}
                                >
                                  {formatCurrency(
                                    convertedAmount.amount,
                                    convertedAmount.currency
                                  )}
                                  <span className={styles.badgeCurrency}>
                                    {convertedAmount.currency}
                                  </span>
                                </span>
                              </div>

                              <div className={styles.reviewItem}>
                                <span className={styles.reviewLabel}>
                                  Exchange rate
                                </span>
                                <span className={styles.reviewValue}>
                                  {formatCurrency(1, formData.currency)} ={" "}
                                  {formatCurrency(
                                    convertedAmount.rate,
                                    convertedAmount.currency
                                  )}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className={styles.flexFill} />
                        <div className={styles.divider} />

                        <div
                          className={`${styles.reviewItem} ${styles.totalAmount}`}
                        >
                          <span className={styles.reviewLabel}>
                            Total amount to debit
                          </span>
                          <span
                            className={`${styles.reviewValue} ${styles.money} ${styles.emphasis}`}
                          >
                            {formatCurrency(
                              formData.amount || 0,
                              formData.currency
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.reviewCol}>
                    <div className={styles.summaryCard}>
                      <div className={styles.cardHeader}>Beneficiary</div>
                      <div className={styles.beneficiaryName}>
                        {formData.beneficiaryName}
                      </div>
                      {formData.message && (
                        <div className={styles.messagePreview}>
                          <span style={{ fontWeight: 500 }}>Message:</span>{" "}
                          {formData.message}
                        </div>
                      )}
                    </div>

                    <div className={styles.summaryCard}>
                      <div className={styles.cardHeader}>Bank details</div>
                      <div className={styles.metaRow}>
                        <span>Country</span>
                        <span className={styles.bankDetails}>
                          <div className={styles.bankFlag}>
                            {formData.destinationCountry && (
                              <span
                                className={`fi fi-${formData.destinationCountry.toLowerCase()}`}
                              ></span>
                            )}
                            <span>
                              {getCountryName(formData.destinationCountry)}
                            </span>
                          </div>
                        </span>
                      </div>
                      <div className={styles.metaRow}>
                        <span>Bank</span>
                        <span>{formData.bankName}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <span>SWIFT/BIC</span>
                        <span>{formData.swiftBic}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <span>Account</span>
                        <span>{formData.accountNumber}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.termsContainer}>
                  <label className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      required
                    />
                    <span className={styles.checkmark}></span>
                    <span>
                      I confirm that the information provided is accurate and I
                      agree to the Terms & Conditions.
                    </span>
                  </label>
                </div>

                <div className={styles.noticeBox}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 8V12"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 16H12.01"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <strong>Important:</strong> Please verify all details before
                    confirming. International transfers cannot be reversed once
                    processed.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            {currentStep > 1 ? (
              <Button
                type="button"
                onClick={prevStep}
                variant="outline"
                className={styles.backButton}
              >
                Previous
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => navigate(-1)}
                variant="outline"
                className={styles.backButton}
              >
                Back to Dashboard
              </Button>
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={() => {
                  // Mark current step fields as touched so their errors show
                  markTouched(stepApiFields[currentStep] || []);
                  setStepAttempted(true);
                  const mapped = mapUiToApi(formData);
                  const { errors: errMap } = validateMapped(mapped);
                  setErrors(errMap || {});
                  if (!hasStepErrors(currentStep, mapped, errMap || {})) {
                    setStepAttempted(false);
                    setCurrentStep(currentStep + 1);
                  }
                }}
                variant="primary"
                disabled={!isStepValid(currentStep)}
                className={styles.submitButton}
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleMakePayment}
                variant="primary"
                disabled={!isStepValid(4) || isSubmitting}
                className={styles.submitButton}
              >
                {isSubmitting ? "Processing..." : "Make Payment"}
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Confirm Payment</h3>
            <p>
              Are you sure you want to make this payment of{" "}
              <strong>
                {formatCurrency(formData.amount || 0, formData.currency)}
              </strong>{" "}
              to <strong>{formData.beneficiaryName}</strong>?
            </p>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
              This action cannot be undone. Please make sure all details are
              correct.
            </p>
            <div className={styles.modalButtons}>
              <Button
                type="button"
                onClick={handleCancelPayment}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmPayment}
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Yes, Make Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionPage;
