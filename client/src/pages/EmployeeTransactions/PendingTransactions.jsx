import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiClock, FiEye } from "react-icons/fi";
import Button from "../../components/Common/Button/Button";
import SearchBar from "../../components/SearchBar/SearchBar";
import Dropdown from "../../components/Common/Dropdown/Dropdown";
import { apiRequest } from "../../utils/apiUtil";
import styles from "./PendingTransactions.module.css";

function formatMoney(value, currency = "ZAR") {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
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

const PendingTransactions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [transactions, setTransactions] = useState([]);
  const [queueStats, setQueueStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const riskOptions = [
    { value: "all", label: "All Risk Levels" },
    { value: "risk_high", label: "High Risk" },
    { value: "risk_medium", label: "Medium Risk" },
    { value: "risk_low", label: "Low Risk" },
    { value: "risk_none", label: "No Risk" },
  ];

  // Fetch pending transactions from API
  useEffect(() => {
    const fetchPendingTransactions = async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          limit: "100",
          filterType: riskFilter,
        });
        const data = await apiRequest(`/api/employees/review-queue?${params}`);
        setTransactions(data.items || []);
        setQueueStats(data.queueStats || null);
      } catch (err) {
        console.error("Failed to fetch pending transactions:", err);
        setError(err.message || "Failed to load pending transactions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingTransactions();
  }, [riskFilter]);

  const getRiskBadge = (riskLevel) => {
    const normalizedRisk = (riskLevel || "none").toLowerCase();
    const riskClasses = {
      high: `${styles.statusPill} ${styles.riskHigh}`,
      medium: `${styles.statusPill} ${styles.riskMedium}`,
      low: `${styles.statusPill} ${styles.riskLow}`,
      none: `${styles.statusPill}`,
    };

    const riskLabels = {
      high: "High Risk",
      medium: "Medium Risk",
      low: "Low Risk",
      none: "No Risk",
    };

    return (
      <span className={riskClasses[normalizedRisk] || styles.statusPill}>
        {riskLabels[normalizedRisk] || "No Risk"}
      </span>
    );
  };

  const filteredPending = useMemo(() => {
    if (!searchTerm.trim()) return transactions;

    const searchLower = searchTerm.toLowerCase();
    return transactions.filter(
      (txn) =>
        (txn.id || txn._id || "").toLowerCase().includes(searchLower) ||
        (txn.senderName || "").toLowerCase().includes(searchLower) ||
        (txn.recipientName || "").toLowerCase().includes(searchLower) ||
        (txn.amount || "").toString().includes(searchTerm)
    );
  }, [searchTerm, transactions]);
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

          <div className={styles.toolbar}>
            <div className={styles.searchAndFilter}>
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder="Search pending transactions..."
                className={styles.searchBar}
              />
              <div className={styles.filterDropdown}>
                <Dropdown
                  id="risk-filter"
                  value={riskFilter}
                  options={riskOptions}
                  onChange={(value) => setRiskFilter(value)}
                  className={styles.riskDropdown}
                />
              </div>
            </div>
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Queue</h3>
            <div className={styles.queueCount}>
              {isLoading ? "Loading..." : `${filteredPending.length} pending`}
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
                    <th>Risk Level</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.length > 0 ? (
                    filteredPending.map((t) => (
                      <tr key={t.id || t._id}>
                        <td className={styles.mono}>{t.id || t._id}</td>
                        <td>{t.senderName || "—"}</td>
                        <td>{t.recipientName || "—"}</td>
                        <td>{formatMoney(t.amount, t.currency)}</td>
                        <td>{t.currency || "ZAR"}</td>
                        <td>{formatDate(t.createdAtEpoch)}</td>
                        <td>{getRiskBadge(t.riskLevel)}</td>
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
                          ? "No pending transactions match your criteria"
                          : "No pending transactions found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            {!isLoading && transactions.length === 0 && !error && (
              <div className={styles.emptyState}>No pending transactions</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PendingTransactions;
