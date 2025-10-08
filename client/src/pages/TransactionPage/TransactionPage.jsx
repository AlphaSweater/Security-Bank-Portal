import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Common/Button/Button';
import styles from './TransactionPage.module.css';
import Footer from '../../components/Footer/Footer';

const TransactionPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    recipientName: '',
    accountNumber: '',
    bankName: '',
    swiftCode: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();

  const steps = [
    { number: 1, title: 'Amount & Sender', description: 'Transfer amount and your bank details' },
    { number: 2, title: 'Recipient', description: 'Recipient information' },
    { number: 3, title: 'Review', description: 'Confirm your transfer' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        return formData.recipientName && formData.accountNumber && formData.bankName && formData.swiftCode;
      case 3:
        return true; // Review step is always valid
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
                <h2>Transfer Amount</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                  Enter the amount you want to transfer and your bank's SWIFT code.
                </p>

                <div className={styles.formGroup}>
                  <label htmlFor="amount">Amount to Transfer</label>
                  <div className={styles.amountInput}>
                    <span className={styles.currencySymbol}>$</span>
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
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className={styles.currencySelect}
                      aria-label="Select currency"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Your Bank's SWIFT Code</label>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    CHASUS33XXX
                  </div>
                  <small style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    This is your bank's SWIFT/BIC code for international transfers
                  </small>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2>Recipient Details</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                  Enter the recipient's information exactly as it appears on their bank account.
                </p>

                <div className={styles.formGroup}>
                  <label htmlFor="recipientName">Recipient's Full Name</label>
                  <input
                    id="recipientName"
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleChange}
                    placeholder="As it appears on bank account"
                    required
                    className={styles.inputField}
                  />
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

                <div className={styles.formGroup}>
                  <label htmlFor="bankName">Bank Name</label>
                  <input
                    id="bankName"
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="Recipient's bank name"
                    required
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="swiftCode">SWIFT/BIC Code</label>
                  <input
                    id="swiftCode"
                    type="text"
                    name="swiftCode"
                    value={formData.swiftCode}
                    onChange={handleChange}
                    placeholder="e.g., CHASUS33XXX"
                    required
                    className={styles.inputField}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2>Review Your Transfer</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                  Please review all details before confirming your transfer.
                </p>

                <div className={styles.reviewSection}>
                  <h3>Transfer Summary</h3>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className={styles.reviewItem} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Amount:</span>
                      <span style={{ fontWeight: '600' }}>
                        {formData.currency} {parseFloat(formData.amount || 0).toLocaleString()}
                      </span>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

                    <div className={styles.reviewItem} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Recipient:</span>
                      <span style={{ fontWeight: '600' }}>{formData.recipientName}</span>
                    </div>

                    <div className={styles.reviewItem} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Account Number:</span>
                      <span style={{ fontWeight: '600' }}>{formData.accountNumber}</span>
                    </div>

                    <div className={styles.reviewItem} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Bank Name:</span>
                      <span style={{ fontWeight: '600' }}>{formData.bankName}</span>
                    </div>

                    <div className={styles.reviewItem} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SWIFT Code:</span>
                      <span style={{ fontWeight: '600' }}>{formData.swiftCode}</span>
                    </div>

                    <div className={styles.reviewItem} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>From Bank:</span>
                      <span style={{ fontWeight: '600' }}>CHASUS33XXX</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid #ffc107',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginTop: '1.5rem'
                }}>
                  <p style={{ margin: 0, color: '#856404', fontSize: '0.9rem' }}>
                    <strong>Important:</strong> Please double-check all details. International transfers cannot be reversed once processed.
                  </p>
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
            <p>Are you sure you want to make this payment of <strong>{formData.currency} {parseFloat(formData.amount || 0).toLocaleString()}</strong> to <strong>{formData.recipientName}</strong>?</p>
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
