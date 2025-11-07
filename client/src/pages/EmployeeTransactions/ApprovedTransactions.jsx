import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiCheckCircle, FiEye } from "react-icons/fi";
import Button from "../../components/Common/Button/Button";
import SearchBar from "../../components/SearchBar/SearchBar";
import { apiRequest } from "../../utils/apiUtil";
import styles from "./ApprovedTransactions.module.css";

function formatMoney(value, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(epoch) {
  if (!epoch) return "—";
  const date = new Date(epoch * 1000);
  return date.toLocaleString("en-ZA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ApprovedTransactions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch approved transactions from API
  useEffect(() => {
    const fetchApprovedTransactions = async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          status: "approved",
          limit: "100",
        });
        const data = await apiRequest(
          `/api/employees/reviewed-transactions?${params}`
        );
        setTransactions(data.items || []);
      } catch (err) {
        console.error("Failed to fetch approved transactions:", err);
        setError(err.message || "Failed to load approved transactions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovedTransactions();
  }, []);

  const filteredApproved = useMemo(() => {
    if (!searchTerm.trim()) return transactions;

    const searchLower = searchTerm.toLowerCase();
    return transactions.filter(
      (txn) =>
        (txn.id || txn._id || "").toLowerCase().includes(searchLower) ||
        (txn.senderName || "").toLowerCase().includes(searchLower) ||
        (txn.recipientName || "").toLowerCase().includes(searchLower) ||
        (txn.amount || "").toString().includes(searchTerm) ||
        (txn.reviewedBy || "").toLowerCase().includes(searchLower)
    );
  }, [searchTerm, transactions]);
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

          <div className={styles.searchContainer}>
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Search approved transactions..."
              className={styles.searchBar}
            />
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Approval History</h3>
            <div className={styles.queueCount}>
              {isLoading ? "Loading..." : `${filteredApproved.length} approved`}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {isLoading ? (
              <div className={styles.loadingState}>Loading transactions...</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Sender</th>
                    <th>Recipient</th>
                    <th>Amount</th>
                    <th>Currency</th>
                    <th>Created</th>
                    <th>Approved At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApproved.length > 0 ? (
                    filteredApproved.map((t) => (
                      <tr key={t.id || t._id}>
                        <td className={styles.mono}>{t.id || t._id}</td>
                        <td>{t.senderName || "—"}</td>
                        <td>{t.recipientName || "—"}</td>
                        <td>{formatMoney(t.amount, t.currency)}</td>
                        <td>{t.currency || "ZAR"}</td>
                        <td>{formatDate(t.createdAtEpoch)}</td>
                        <td>{formatDate(t.statusUpdatedAtEpoch)}</td>
                        <td>
                          <Button
                            size="small"
                            variant="outline"
                            aria-label={`View ${t.id || t._id}`}
                            onClick={() =>
                              navigate(`/transactions/review/${t.id || t._id}`)
                            }
                            icon={FiEye}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className={styles.noResults}>
                        {searchTerm
                          ? "No approved transactions found matching your search"
                          : "No approved transactions found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            {!isLoading && transactions.length === 0 && !error && (
              <div className={styles.emptyState}>
                No approved transactions found
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApprovedTransactions;
