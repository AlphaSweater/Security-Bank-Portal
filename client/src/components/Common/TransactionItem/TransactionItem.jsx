import { FiDollarSign, FiCreditCard } from "react-icons/fi";
import styles from "./TransactionItem.module.css";

/**
 * TransactionItem (reusable)
 * Props: tx (object)
 *  - amount: number
 *  - currencyCode: string (ISO 4217)
 *  - beneficiaryFullName?: string
 *  - destinationBankName?: string
 *  - createdAtEpoch?: number (seconds)
 *  - status?: 'pending' | 'approved' | 'rejected'
 */
export default function TransactionItem({ tx, forceExpense = false }) {
  const title = tx.beneficiaryFullName || tx.destinationBankName || "Transfer";
  const createdAtEpoch = Number(tx.createdAtEpoch) || 0;
  const dateStr = createdAtEpoch
    ? new Date(createdAtEpoch * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";
  const rawAmount = Number(tx.amount) || 0;
  const displayAmount = forceExpense ? -Math.abs(rawAmount) : rawAmount;
  const formattedAmount = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayAmount);
  const isIncome = displayAmount >= 0;
  const status = (tx.status || "pending").toLowerCase();

  return (
    <div className={styles.item}>
      <div className={styles.icon}>
        {isIncome ? <FiDollarSign /> : <FiCreditCard />}
      </div>

      <div className={styles.main}>
        <div className={styles.title}>{title}</div>
        <div className={styles.meta}>{dateStr}</div>
      </div>

      <div
        className={`${styles.amount} ${
          isIncome ? styles.income : styles.expense
        }`}
      >
        {formattedAmount}
      </div>

      <span
        className={`${styles.statusPill} ${
          status === "approved"
            ? styles.statusApproved
            : status === "rejected"
            ? styles.statusRejected
            : styles.statusPending
        }`}
        title={`Status: ${status}`}
      >
        {status}
      </span>
    </div>
  );
}
