import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiCheckCircle, FiEye } from "react-icons/fi";
import Button from "../../components/Common/Button/Button";
import styles from "./ApprovedTransactions.module.css";

// Mock data - replace with API call later
const mockApproved = [
  {
    id: "TXN-987654",
    sender: "Global Corp",
    recipient: "Sarah Johnson",
    amount: 3200.0,
    currency: "ZAR",
    createdAt: "2025-11-03 14:30",
    approvedBy: "admin@example.com",
    approvedAt: "2025-11-03 14:45"
  },
  {
    id: "TXN-876543",
    sender: "Tech Solutions",
    recipient: "Michael Brown",
    amount: 1750.5,
    currency: "ZAR",
    createdAt: "2025-11-03 10:15",
    approvedBy: "manager@example.com",
    approvedAt: "2025-11-03 10:30"
  },
  {
    id: "TXN-765432",
    sender: "Innovate Ltd",
    recipient: "Emily Davis",
    amount: 4200.0,
    currency: "ZAR",
    createdAt: "2025-11-02 16:45",
    approvedBy: "admin@example.com",
    approvedAt: "2025-11-02 17:00"
  }
];

function formatMoney(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

const ApprovedTransactions = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <Link to="/dashboard" className={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1 className={styles.heading}>Approved Transactions</h1>
          <div className={styles.subheading}>
            <span className={styles.iconPill} aria-hidden="true">
              <FiCheckCircle />
            </span>
            View all approved transactions
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Approval History</h3>
            <div className={styles.queueCount}>
              {mockApproved.length} approved
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
                  <th>Approved By</th>
                  <th>Approved At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {mockApproved.map((t) => (
                  <tr key={t.id}>
                    <td className={styles.mono}>{t.id}</td>
                    <td>{t.sender}</td>
                    <td>{t.recipient}</td>
                    <td>{formatMoney(t.amount)}</td>
                    <td>{t.currency}</td>
                    <td>{t.createdAt}</td>
                    <td>{t.approvedBy}</td>
                    <td>{t.approvedAt}</td>
                    <td>
                      <Button
                        size="small"
                        variant="outline"
                        aria-label={`View ${t.id}`}
                        onClick={() => navigate(`/transactions/review/${t.id}`)}
                        icon={FiEye}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mockApproved.length === 0 && (
              <div className={styles.emptyState}>No approved transactions found</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApprovedTransactions;
