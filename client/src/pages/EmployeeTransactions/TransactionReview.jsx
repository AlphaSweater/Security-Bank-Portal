import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiClock,
  FiUser,
  FiDollarSign,
  FiMapPin,
  FiCreditCard,
  FiMessageSquare,
} from "react-icons/fi";
import { apiRequest } from "../../utils/apiUtil";
import Button from "../../components/Common/Button/Button";
import RejectTransactionModal from "../../components/Modals/RejectTransactionModal";
import styles from "./TransactionReview.module.css";

// Helper functions
function formatMoney(value, currency) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency || "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(epoch) {
  if (!epoch) return "—";
  const date = new Date(epoch * 1000);
  return date.toLocaleString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRelativeTime(epoch) {
  if (!epoch) return "";
  const now = new Date();
  const date = new Date(epoch * 1000);
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return "";
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

const getCountryName = (code) =>
  countryOptions.find((c) => c.value === code)?.label || code;

const InfoCard = ({ icon: Icon, title, children, highlight }) => (
  <div
    className={`${styles.infoCard} ${highlight ? styles.highlightCard : ""}`}
  >
    <div className={styles.cardIconHeader}>
      <div className={styles.cardIcon}>
        <Icon />
      </div>
      <h3 className={styles.cardTitle}>{title}</h3>
    </div>
    <div className={styles.cardContent}>{children}</div>
  </div>
);

const DetailRow = ({ label, value, mono, icon: Icon }) => (
  <div className={styles.detailRow}>
    <div className={styles.detailLabel}>
      {Icon && <Icon className={styles.detailIcon} />}
      {label}
    </div>
    <div className={`${styles.detailValue} ${mono ? styles.mono : ""}`}>
      {value || "—"}
    </div>
  </div>
);

const TransactionReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [transaction, setTransaction] = useState(null);

  // Fetch transaction details
  useEffect(() => {
    let cancelled = false;

    async function fetchTransaction() {
      try {
        setIsLoading(true);
        setError("");

        const response = await apiRequest(`/api/employees/transactions/${id}`);

        if (cancelled) return;

        setTransaction(response.transaction);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load transaction");
          // eslint-disable-next-line no-console
          console.error("Failed to fetch transaction:", err);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (id) {
      fetchTransaction();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleReject = async (reason) => {
    if (!reason || !reason.trim()) {
      setError("Rejection reason is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await apiRequest(`/api/employees/transactions/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "rejected",
          reason: reason.trim(),
        }),
      });

      // On success, navigate back to pending transactions
      navigate("/transactions/pending", {
        state: { message: "Transaction rejected successfully" },
      });
    } catch (err) {
      setError(err?.message || "Failed to reject transaction");
      // eslint-disable-next-line no-console
      console.error("Rejection error:", err);
    } finally {
      setIsSubmitting(false);
      setIsRejectModalOpen(false);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      await apiRequest(`/api/employees/transactions/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "approved",
        }),
      });

      // On success, navigate back to pending transactions
      navigate("/transactions/pending", {
        state: { message: "Transaction approved successfully" },
      });
    } catch (err) {
      setError(err?.message || "Failed to approve transaction");
      // eslint-disable-next-line no-console
      console.error("Approval error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskBadge = (riskLevel) => {
    if (!riskLevel || riskLevel === "none") return null;

    const riskConfig = {
      high: {
        color: styles.riskHigh,
        label: "HIGH RISK",
        icon: FiAlertTriangle,
      },
      medium: {
        color: styles.riskMedium,
        label: "MEDIUM RISK",
        icon: FiAlertTriangle,
      },
      low: { color: styles.riskLow, label: "LOW RISK", icon: FiAlertTriangle },
    };

    const config = riskConfig[riskLevel];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <div className={`${styles.riskBadge} ${config.color}`}>
        <Icon />
        <span>{config.label}</span>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: styles.statusPending, label: "Pending Review" },
      approved: { color: styles.statusApproved, label: "Approved" },
      rejected: { color: styles.statusRejected, label: "Rejected" },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    return (
      <span className={`${styles.statusPill} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.pageWrapper}>
        <main className={styles.mainContent}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading transaction details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className={styles.pageWrapper}>
        <main className={styles.mainContent}>
          <div className={styles.errorState}>
            <FiAlertTriangle />
            <h2>Failed to Load Transaction</h2>
            <p>{error}</p>
            <div className={styles.errorActions}>
              <Button
                variant="outline"
                onClick={() => navigate("/transactions/pending")}
              >
                Back to Pending
              </Button>
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!transaction) {
    return null;
  }

  const isPending = transaction.status?.toLowerCase() === "pending";
  const relativeTime = getRelativeTime(transaction.createdAtEpoch);
  const transactionId = transaction.id || transaction._id;

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <Link to="/transactions/pending" className={styles.backLink}>
              <FiArrowLeft />
              <span>Back to Pending</span>
            </Link>
            <div className={styles.headerTop}>
              <div>
                <h1 className={styles.heading}>Transaction Review</h1>
                <div className={styles.subheading}>
                  <span className={styles.txId}>ID: {transactionId}</span>
                  {relativeTime && (
                    <span className={styles.timeAgo}>• {relativeTime}</span>
                  )}
                </div>
              </div>
              <div className={styles.headerBadges}>
                {getStatusBadge(transaction.status)}
                {getRiskBadge(transaction.riskLevel)}
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <FiAlertTriangle />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        {isPending && (
          <div className={styles.actionBar}>
            <div className={styles.actionBarContent}>
              <p>Review this transaction and take action</p>
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
                  {isSubmitting ? "Processing..." : "Approve Transaction"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Amount Highlight */}
        <InfoCard icon={FiDollarSign} title="Transaction Amount" highlight>
          <div className={styles.amountDisplay}>
            <div className={styles.primaryAmount}>
              {formatMoney(
                transaction.amount,
                transaction.currencyCode || "ZAR"
              )}
            </div>
            <div className={styles.amountMeta}>
              <span>Currency: {transaction.currencyCode || "ZAR"}</span>
              <span>•</span>
              <span>Created: {formatDate(transaction.createdAtEpoch)}</span>
            </div>
          </div>
        </InfoCard>

        <div className={styles.gridLayout}>
          {/* Beneficiary Information */}
          <InfoCard icon={FiUser} title="Beneficiary Information">
            <DetailRow
              label="Full Name"
              value={transaction.beneficiaryFullName}
            />
            <DetailRow label="Type" value={transaction.beneficiaryType} />
            {transaction.beneficiaryNote && (
              <div className={styles.noteBox}>
                <FiMessageSquare />
                <div>
                  <div className={styles.noteLabel}>Note</div>
                  <div className={styles.noteText}>
                    {transaction.beneficiaryNote}
                  </div>
                </div>
              </div>
            )}
          </InfoCard>

          {/* Bank Details */}
          <InfoCard icon={FiCreditCard} title="Bank & Account Details">
            <DetailRow
              label="Bank Name"
              value={transaction.destinationBankName}
            />
            <DetailRow
              label="SWIFT/BIC"
              value={transaction.destinationBankSwift}
              mono
            />
            <DetailRow
              label="Account Number"
              value={transaction.destinationAccountNumber}
              mono
            />
          </InfoCard>

          {/* Destination Details */}
          <InfoCard icon={FiMapPin} title="Destination">
            <DetailRow
              label="Country"
              value={getCountryName(transaction.destinationCountryCode)}
            />
            <DetailRow
              label="Country Code"
              value={transaction.destinationCountryCode}
              mono
            />
          </InfoCard>

          {/* Transaction Metadata */}
          <InfoCard icon={FiClock} title="Transaction Details">
            <DetailRow label="Transaction ID" value={transactionId} mono />
            <DetailRow label="Status" value={transaction.status} />
            <DetailRow
              label="Created Date"
              value={formatDate(transaction.createdAtEpoch)}
            />
            {transaction.statusUpdatedAtEpoch && (
              <DetailRow
                label="Last Updated"
                value={formatDate(transaction.statusUpdatedAtEpoch)}
              />
            )}
            {transaction.reviewedBy && (
              <DetailRow label="Reviewed By" value={transaction.reviewedBy} />
            )}
            {transaction.rejectionReason && (
              <div className={styles.rejectionBox}>
                <FiXCircle />
                <div>
                  <div className={styles.rejectionLabel}>Rejection Reason</div>
                  <div className={styles.rejectionText}>
                    {transaction.rejectionReason}
                  </div>
                </div>
              </div>
            )}
          </InfoCard>
        </div>

        {/* Reject Modal */}
        <RejectTransactionModal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          onConfirm={handleReject}
          isSubmitting={isSubmitting}
        />
      </main>
    </div>
  );
};

export default TransactionReview;
