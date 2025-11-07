import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiXCircle, FiEye } from "react-icons/fi";
import Button from "../../components/Common/Button/Button";
import SearchBar from "../../components/SearchBar/SearchBar";
import styles from "./RejectedTransactions.module.css";

// Mock data - replace with API call later
const mockRejected = [
  {
    id: "TXN-112233",
    sender: "Global Corp",
    recipient: "John Smith",
    amount: 1500.0,
    currency: "ZAR",
    createdAt: "2025-11-02 09:30",
    rejectedBy: "admin@example.com",
    rejectedAt: "2025-11-02 10:15",
    reason: "Insufficient documentation"
  },
  {
    id: "TXN-445566",
    sender: "Tech Solutions",
    recipient: "Jane Doe",
    amount: 2750.5,
    currency: "ZAR",
    createdAt: "2025-11-01 14:20",
    rejectedBy: "manager@example.com",
    rejectedAt: "2025-11-01 15:00",
    reason: "Suspicious activity detected"
  },
  {
    id: "TXN-778899",
    sender: "Innovate Ltd",
    recipient: "Mike Johnson",
    amount: 3200.0,
    currency: "ZAR",
    createdAt: "2025-10-31 11:45",
    rejectedBy: "admin@example.com",
    rejectedAt: "2025-10-31 12:30",
    reason: "Amount exceeds limit"
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

const RejectedTransactions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRejected = useMemo(() => {
    if (!searchTerm.trim()) return mockRejected;
    
    const searchLower = searchTerm.toLowerCase();
    return mockRejected.filter(txn => 
      txn.id.toLowerCase().includes(searchLower) ||
      txn.sender.toLowerCase().includes(searchLower) ||
      txn.recipient.toLowerCase().includes(searchLower) ||
      txn.amount.toString().includes(searchTerm) ||
      txn.rejectedBy.toLowerCase().includes(searchLower) ||
      txn.reason.toLowerCase().includes(searchLower)
    );
  }, [searchTerm]);
  
  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <Link to="/dashboard" className={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1 className={styles.heading}>Rejected Transactions</h1>
          <div className={styles.subheading}>
            <span className={styles.iconPill} aria-hidden="true">
              <FiXCircle />
            </span>
            View all rejected transactions
          </div>
          
          <div className={styles.searchContainer}>
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Search rejected transactions..."
              className={styles.searchBar}
            />
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Rejection History</h3>
            <div className={styles.queueCount}>
              {filteredRejected.length} rejected
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
                  <th>Rejected By</th>
                  <th>Rejected At</th>
                  <th>Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRejected.length > 0 ? (
                  filteredRejected.map((t) => (
                  <tr key={t.id}>
                    <td className={styles.mono}>{t.id}</td>
                    <td>{t.sender}</td>
                    <td>{t.recipient}</td>
                    <td>{formatMoney(t.amount)}</td>
                    <td>{t.currency}</td>
                    <td>{t.createdAt}</td>
                    <td>{t.rejectedBy}</td>
                    <td>{t.rejectedAt}</td>
                    <td>{t.reason}</td>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className={styles.noResults}>
                      No rejected transactions found matching your search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {mockRejected.length === 0 && (
              <div className={styles.emptyState}>No rejected transactions found</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RejectedTransactions;
