import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiXCircle } from "react-icons/fi";
import Button from "../../components/Common/Button/Button";
import RejectTransactionModal from "../../components/Modals/RejectTransactionModal";
import styles from "./TransactionReview.module.css";

// Mock fetch for UI purposes only
const mockTransaction = (id) => ({
  id,
  sender: "Acme Corp",
  recipient: "John Smith",
  beneficiaryType: "Individual", // 'Individual' | 'Business'
  amount: 2500.0,
  currency: "ZAR",
  destinationCountry: "ZA",
  bankName: "Standard Bank",
  swiftBic: "SBZAZAJJ",
  accountNumber: "1234567890",
  message: "Invoice #4402",
  createdAt: "2025-11-04 09:15",
  createdAtTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  status: "Pending",
});

function formatMoney(value, currency) {
  const num = Number(value) || 0;
  return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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

const getCountryName = (code) => countryOptions.find((c) => c.value === code)?.label || code;

const Row = ({ label, value, mono }) => (
  <div className={styles.row}>
    <div className={styles.label}>{label}</div>
    <div className={`${styles.value} ${mono ? styles.mono : ""}`}>{value}</div>
  </div>
);

const TransactionReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const tx = mockTransaction(id || "TXN-UNKNOWN");

  const handleReject = async (reason) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // TODO: Replace with actual API call
      console.log('Rejecting transaction with reason:', reason);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // On success, navigate back to pending transactions
      navigate('/transactions/pending');
      // You might want to show a success toast here
    } catch (err) {
      setError('Failed to reject transaction. Please try again.');
      console.error('Rejection error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // TODO: Replace with actual API call
      console.log('Approving transaction');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // On success, navigate back to pending transactions
      navigate('/transactions/pending');
      // You might want to show a success toast here
    } catch (err) {
      setError('Failed to approve transaction. Please try again.');
      console.error('Approval error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <Link to="/transactions/pending" className={styles.backLink}>
              <FiArrowLeft />
              <span>Back to Pending</span>
            </Link>
            <h1 className={styles.heading}>Review Transaction</h1>
            <div className={styles.subheading}>
              <span className={styles.mono}>{tx.id}</span>
              <span className={`${styles.statusPill} ${styles.statusPending}`}>{tx.status}</span>
            </div>
          </div>
          <div className={styles.actions}>
            <Button
              variant="outline"
              size="medium"
              icon={FiXCircle}
              onClick={() => setIsRejectModalOpen(true)}
              disabled={isSubmitting}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="medium"
              icon={FiCheckCircle}
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Approve'}
            </Button>
          </div>
          {error && <div className={styles.errorBanner}>{error}</div>}
        </div>

        <div className={styles.card}>
          <div className={styles.sectionHeader}>Overview</div>
          <div className={styles.grid}>
            <Row label="Beneficiary Name" value={tx.recipient} />
            <Row label="Beneficiary Type" value={tx.beneficiaryType} />
            <Row label="Amount" value={formatMoney(tx.amount, tx.currency)} />
            <Row label="Currency" value={tx.currency} mono />
            <Row label="Destination Country" value={getCountryName(tx.destinationCountry)} />
            <Row label="Created" value={tx.createdAt} />
            <Row label="Time Zone" value={tx.createdAtTimeZone} />
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.sectionHeader}>Bank & Account</div>
          <div className={styles.grid}>
            <Row label="Bank Name" value={tx.bankName} />
            <Row label="SWIFT/BIC" value={tx.swiftBic} mono />
            <Row label="Account Number" value={tx.accountNumber} mono />
            <Row label="Message" value={tx.message || "—"} />
          </div>
        </div>
        <RejectTransactionModal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          onConfirm={handleReject}
        />
      </main>
    </div>
  );
};

export default TransactionReview;
