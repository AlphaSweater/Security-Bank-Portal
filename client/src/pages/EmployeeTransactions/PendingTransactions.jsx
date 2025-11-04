import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiClock, FiEye } from "react-icons/fi";
import Button from "../../components/Common/Button/Button";
import styles from "./PendingTransactions.module.css";

const mockPending = [
  {
    id: "TXN-102938",
    sender: "Acme Corp",
    recipient: "John Smith",
    amount: 2500.0,
    currency: "ZAR",
    createdAt: "2025-11-04 09:15",
  },
  {
    id: "TXN-102939",
    sender: "Jane Doe",
    recipient: "Mike Johnson",
    amount: 1800.5,
    currency: "USD",
    createdAt: "2025-11-04 08:05",
  },
  {
    id: "TXN-102940",
    sender: "Contoso Ltd",
    recipient: "Alice Brown",
    amount: 5200.75,
    currency: "EUR",
    createdAt: "2025-11-03 17:42",
  },
];

function formatMoney(value) {
  const num = Number(value) || 0;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const PendingTransactions = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <Link to="/dashboard" className={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1 className={styles.heading}>Pending Transactions</h1>
          <div className={styles.subheading}>
            <span className={styles.iconPill} aria-hidden="true">
              <FiClock />
            </span>
            Review transactions awaiting approval
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Queue</h3>
            <div className={styles.queueCount}>
              {mockPending.length} pending
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Sender</th>
                  <th>Recipient</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {mockPending.map((t) => (
                  <tr key={t.id}>
                    <td className={styles.mono}>{t.id}</td>
                    <td>{t.sender}</td>
                    <td>{t.recipient}</td>
                    <td>{formatMoney(t.amount)}</td>
                    <td>{t.currency}</td>
                    <td>{t.createdAt}</td>
                    <td>
                      <span className={`${styles.statusPill} ${styles.statusPending}`}>
                        Pending
                      </span>
                    </td>
                    <td>
                      <Button size="small" variant="outline" aria-label={`View ${t.id}`} onClick={() => navigate(`/transactions/review/${t.id}`)} icon={FiEye}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mockPending.length === 0 && (
              <div className={styles.emptyState}>No pending transactions</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PendingTransactions;
