import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Common/Button/Button';
import styles from './TransactionPage.module.css';
import Footer from '../../components/Footer/Footer';

const TransactionPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  // Exchange rates (as of October 2024, these would typically come from an API in production)
  const exchangeRates = {
    USD: { EUR: 0.94, GBP: 0.82, JPY: 149.50, CAD: 1.36, AUD: 1.55, ZAR: 18.75 },
    EUR: { USD: 1.06, GBP: 0.87, JPY: 159.20, CAD: 1.45, AUD: 1.65, ZAR: 19.95 },
    GBP: { USD: 1.22, EUR: 1.15, JPY: 183.50, CAD: 1.66, AUD: 1.89, ZAR: 22.90 },
    JPY: { USD: 0.0067, EUR: 0.0063, GBP: 0.0055, CAD: 0.0091, AUD: 0.0103, ZAR: 0.125 },
    CAD: { USD: 0.74, EUR: 0.69, GBP: 0.60, JPY: 110.50, AUD: 1.14, ZAR: 13.80 },
    AUD: { USD: 0.65, EUR: 0.61, GBP: 0.53, JPY: 97.20, CAD: 0.88, ZAR: 12.10 },
    ZAR: { USD: 0.053, EUR: 0.050, GBP: 0.044, JPY: 8.00, CAD: 0.072, AUD: 0.083 }
  };

  const [formData, setFormData] = useState({
    // Step 1: Amount & Currency
    amount: '',
    currency: 'USD',
    // Step 2: Beneficiary
    beneficiaryType: 'person', // 'person' or 'business'
    beneficiaryName: '',
    message: '',
    // Step 3: Bank & Account
    destinationCountry: '',
    bankName: '',
    swiftBic: '',
    accountNumber: '',
    // Step 4: Review
    agreeTerms: false,
  });

  // Format currency with symbol
  const formatCurrency = (amount, currencyCode) => {
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': '$',
      'AUD': '$',
      'ZAR': 'R'
    };
    const symbol = currencySymbols[currencyCode] || currencyCode;
    const amountValue = parseFloat(amount) || 0;
    return `${symbol}${amountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate converted amount based on destination country
  const getConvertedAmount = () => {
    if (!formData.amount || !formData.destinationCountry) return null;

    const countryToCurrency = {
      'US': 'USD',
      'GB': 'GBP',
      'DE': 'EUR',
      'FR': 'EUR',
      'JP': 'JPY',
      'CA': 'CAD',
      'AU': 'AUD',
      'ZA': 'ZAR'
    };

    const targetCurrency = countryToCurrency[formData.destinationCountry] || 'EUR';
    
    // If source and target currencies are the same, no conversion needed
    if (formData.currency === targetCurrency) {
      return {
        amount: parseFloat(formData.amount) || 0,
        currency: targetCurrency,
        rate: 1,
        formattedAmount: formatCurrency(formData.amount || 0, targetCurrency),
        formattedRate: formatCurrency(1, targetCurrency)
      };
    }

    // Get the exchange rate from source to target currency
    const rate = exchangeRates[formData.currency]?.[targetCurrency];
    
    // If direct rate not found, try to find a path through USD
    let calculatedRate = rate;
    if (!rate && formData.currency !== 'USD' && targetCurrency !== 'USD') {
      const toUsdRate = exchangeRates[formData.currency]?.USD;
      const fromUsdRate = exchangeRates.USD?.[targetCurrency];
      if (toUsdRate && fromUsdRate) {
        calculatedRate = toUsdRate * fromUsdRate;
      }
    }

    // If still no rate, default to 1 (shouldn't happen with our currency set)
    if (!calculatedRate) {
      console.warn(`No exchange rate found from ${formData.currency} to ${targetCurrency}`);
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
      formattedInverseRate: formatCurrency(1 / calculatedRate, formData.currency)
    };
  };

  const convertedAmount = getConvertedAmount();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();

  const steps = [
    { number: 1, title: 'Amount & Currency', description: 'Enter transfer amount' },
    { number: 2, title: 'Beneficiary', description: 'Recipient details' },
    { number: 3, title: 'Bank & Account', description: 'Bank information' },
    { number: 4, title: 'Review & Confirm', description: 'Verify all details' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'swiftBic' ? value.toUpperCase() : value,
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to dashboard after successful submission
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakePayment = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to dashboard after successful submission
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPayment = () => {
    setShowConfirmModal(false);
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return formData.amount && parseFloat(formData.amount) > 0 && formData.currency;
      case 2:
        return formData.beneficiaryName &&
              (formData.beneficiaryType === 'business' || formData.beneficiaryName.split(' ').length >= 2);
      case 3:
        return formData.destinationCountry &&
              formData.bankName &&
              formData.swiftBic &&
              formData.accountNumber &&
              formData.swiftBic.length >= 8 &&
              formData.swiftBic.length <= 11;
      case 4:
        return formData.agreeTerms;
      default:
        return false;
    }
  };

  const handleNextClick = () => {
    if (isStepValid(currentStep)) {
      nextStep();
    }
  };

  return (
    <div className={styles.transactionPage}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1>International Transfer</h1>
        </div>

        {/* Step Indicators */}
        <div className={styles.stepper}>
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div
                className={`${styles.step} ${currentStep === step.number ? styles.active : ''} ${currentStep > step.number ? styles.completed : ''}`}
              >
                <div className={styles.stepNumber}>
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <div className={styles.stepLabel}>
                  <div style={{ fontWeight: '600' }}>{step.title}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`${styles.connector} ${currentStep > step.number ? styles.completed : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.stepContent}>
            {currentStep === 1 && (
              <div>
                <h2>Amount & Currency</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                  Enter the amount you want to transfer and select the currency.
                </p>

                <div className={styles.formGroup}>
                  <label htmlFor="amount">Amount</label>
                  <div className={styles.amountInput}>
                    <div className={styles.currencySymbol}>
                      {formData.currency === 'USD' ? '$' :
                       formData.currency === 'EUR' ? '€' :
                       formData.currency === 'GBP' ? '£' :
                       formData.currency === 'JPY' ? '¥' :
                       formData.currency === 'CAD' ? '$' :
                       formData.currency === 'AUD' ? '$' : ''}
                    </div>
                    <input
                      id="amount"
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                      required
                      className={styles.amountField}
                      aria-label="Amount to transfer"
                      style={{paddingLeft: '2.5rem'}}
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className={styles.inputField}
                      aria-label="Select currency"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <div className={styles.infoBox}>
                    <div className={styles.infoRow}>
                      <span>Estimated delivery:</span>
                      <span>1-2 business days</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2>Beneficiary Details</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                  Enter the recipient's personal or business information.
                </p>

                <div className={styles.formGroup}>
                  <label>Beneficiary Type</label>
                  <div className={styles.segmentedControl}>
                    <button
                      type="button"
                      className={`${styles.segment} ${formData.beneficiaryType === 'person' ? styles.active : ''}`}
                      onClick={() => setFormData({...formData, beneficiaryType: 'person'})}
                    >
                      Person
                    </button>
                    <button
                      type="button"
                      className={`${styles.segment} ${formData.beneficiaryType === 'business' ? styles.active : ''}`}
                      onClick={() => setFormData({...formData, beneficiaryType: 'business'})}
                    >
                      Business
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="beneficiaryName">
                    {formData.beneficiaryType === 'person' ? 'Full Name' : 'Business Name'}
                  </label>
                  <input
                    id="beneficiaryName"
                    type="text"
                    name="beneficiaryName"
                    value={formData.beneficiaryName}
                    onChange={handleChange}
                    placeholder={formData.beneficiaryType === 'person' 
                      ? 'First and last name' 
                      : 'Legal business name'}
                    required
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message">Message to Beneficiary (Optional)</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Add a message to the beneficiary"
                    rows="3"
                    className={styles.inputField}
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                  <small style={{ color: 'var(--color-text-muted)' }}>
                    Maximum 140 characters
                  </small>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2>Bank & Account Details</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                  Enter the recipient's bank information.
                </p>

                <div className={styles.formGroup}>
                  <label htmlFor="destinationCountry">Destination Country</label>
                  <select
                    id="destinationCountry"
                    name="destinationCountry"
                    value={formData.destinationCountry}
                    onChange={handleChange}
                    className={styles.inputField}
                    required
                  >
                    <option value="">Select a country</option>
                    <option value="US">United States (USD)</option>
                    <option value="GB">United Kingdom (GBP)</option>
                    <option value="CA">Canada (CAD)</option>
                    <option value="AU">Australia (AUD)</option>
                    <option value="DE">Germany (EUR)</option>
                    <option value="FR">France (EUR)</option>
                    <option value="JP">Japan (JPY)</option>
                    <option value="ZA">South Africa (ZAR)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="bankName">Bank Name</label>
                  <input
                    id="bankName"
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="Start typing to search bank"
                    required
                    className={styles.inputField}
                    list="bankSuggestions"
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
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="swiftBic">SWIFT/BIC Code</label>
                  <input
                    id="swiftBic"
                    type="text"
                    name="swiftBic"
                    value={formData.swiftBic}
                    onChange={handleChange}
                    placeholder="e.g., CHASUS33XXX"
                    required
                    className={styles.inputField}
                    style={{ textTransform: 'uppercase' }}
                    maxLength={11}
                  />
                  <small style={{ color: 'var(--color-text-muted)' }}>
                    {formData.swiftBic.length < 8 || formData.swiftBic.length > 11 
                      ? 'SWIFT/BIC must be 8 or 11 characters' 
                      : '8 or 11 characters, letters and numbers only'}
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="accountNumber">Account Number</label>
                  <input
                    id="accountNumber"
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="Enter account number"
                    required
                    className={styles.inputField}
                    inputMode="numeric"
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2>Review & Confirm</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                  Please review all details before confirming your transfer.
                </p>

                <div className={styles.reviewSection}>
                  <h3>Transfer Summary</h3>

                  <div className={styles.reviewGrid}>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>You send</span>
                      <span className={styles.reviewValue}>
                        {formatCurrency(formData.amount || 0, formData.currency)}
                      </span>
                    </div>

                    {convertedAmount && (
                      <>
                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>Recipient gets</span>
                          <span className={styles.reviewValue}>
                            {formatCurrency(convertedAmount.amount, convertedAmount.currency)}
                          </span>
                        </div>

                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>Exchange rate</span>
                          <span className={styles.reviewValue}>
                            {formatCurrency(1, formData.currency)} = {formatCurrency(convertedAmount.rate, convertedAmount.currency)}
                          </span>
                        </div>
                      </>
                    )}

                    <div className={`${styles.reviewItem} ${styles.totalAmount}`}>
                      <span className={styles.reviewLabel}>Total amount to debit</span>
                      <span className={styles.reviewValue}>
                        {formatCurrency(formData.amount || 0, formData.currency)}
                      </span>
                    </div>

                    <div className={styles.reviewDivider} />

                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Beneficiary</span>
                      <span className={styles.reviewValue}>
                        {formData.beneficiaryName}
                        {formData.message && (
                          <div className={styles.messagePreview}>
                            <span style={{ fontWeight: 500 }}>Message:</span> {formData.message}
                          </div>
                        )}
                      </span>
                    </div>

                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Bank Details</span>
                      <div className={styles.bankDetails}>
                        <div className={styles.bankFlag}>
                          {formData.destinationCountry && (
                            <span className={`fi fi-${formData.destinationCountry.toLowerCase()}`}></span>
                          )}
                          <span>{formData.destinationCountry}</span>
                        </div>
                        <div>{formData.bankName}</div>
                        <div>SWIFT/BIC: {formData.swiftBic}</div>
                        <div>Account: ••••{formData.accountNumber.slice(-4)}</div>
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
                    <span>I confirm that the information provided is accurate and I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>.</span>
                  </label>
                </div>

                <div className={styles.noticeBox}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8V12" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16H12.01" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <strong>Important:</strong> Please verify all details before confirming. International transfers cannot be reversed once processed.
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

            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={handleNextClick}
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
                disabled={isSubmitting}
                className={styles.submitButton}
              >
                {isSubmitting ? 'Processing...' : 'Make Payment'}
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
            <p>Are you sure you want to make this payment of <strong>{formatCurrency(formData.amount || 0, formData.currency)}</strong> to <strong>{formData.beneficiaryName}</strong>?</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              This action cannot be undone. Please make sure all details are correct.
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
                {isSubmitting ? 'Processing...' : 'Yes, Make Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default TransactionPage;
