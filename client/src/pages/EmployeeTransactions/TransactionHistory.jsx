import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiDollarSign,
  FiUser,
  FiCreditCard,
  FiFileText,
} from "react-icons/fi";
import SearchBar from "../../components/SearchBar/SearchBar";
import Dropdown from "../../components/Common/Dropdown/Dropdown";
import { apiRequest } from "../../utils/apiUtil";
import styles from "./TransactionHistory.module.css";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
    { value: "rejected", label: "Rejected" },
  ];

  // Fetch all reviewed transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          limit: "100",
        });

        // Add status filter if not "all"
        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        const data = await apiRequest(
          `/api/employees/reviewed-transactions?${params}`
        );
        setTransactions(data.items || []);
      } catch (err) {
        console.error("Failed to fetch transaction history:", err);
        setError(err.message || "Failed to load transaction history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [statusFilter]);

  const formatDate = (epoch) => {
    if (!epoch) return "—";
    const date = new Date(epoch * 1000);
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString(undefined, options);
  };

  const formatMoney = (value, currency = "ZAR") => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = (status || "").toLowerCase();
    const statusClasses = {
      approved: styles.statusCompleted,
      pending: styles.statusPending,
      rejected: styles.statusFailed,
    };

    const statusIcons = {
      approved: <FiCheckCircle className={styles.statusIcon} />,
      pending: <FiClock className={styles.statusIcon} />,
      rejected: <FiXCircle className={styles.statusIcon} />,
    };

    return (
      <span
        className={`${styles.statusBadge} ${
          statusClasses[normalizedStatus] || ""
        }`}
      >
        {statusIcons[normalizedStatus]}
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    // Since we don't have type in our transaction data, we'll use a default icon
    return <FiDollarSign className={styles.typeIcon} />;
  };

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;

    const searchLower = searchTerm.toLowerCase();
    return transactions.filter((txn) => {
      return (
        (txn.id || txn._id || "").toLowerCase().includes(searchLower) ||
        (txn.senderName || "").toLowerCase().includes(searchLower) ||
        (txn.recipientName || "").toLowerCase().includes(searchLower) ||
        (txn.senderAccountNumber || "").toLowerCase().includes(searchLower) ||
        (txn.recipientAccountNumber || "")
          .toLowerCase()
          .includes(searchLower) ||
        (txn.amount || "").toString().includes(searchTerm)
      );
    });
  }, [transactions, searchTerm]);

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.topBar}>
          <Link to="/dashboard" className={styles.backLink}>
            <FiArrowLeft className={styles.backIcon} /> Back to Dashboard
          </Link>
        </div>

        <header className={styles.pageHeader}>
          <h1 className={styles.heading}>Transaction History</h1>
          <div className={styles.subheading}>
            <span className={styles.iconPill} aria-hidden>
              <FiFileText />
            </span>
            View and manage all transactions
          </div>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.searchAndFilter}>
            <div className={styles.searchBox}>
              <FiSearch aria-hidden />
              <input
                id="transactionSearch"
                aria-label="Search transactions"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                type="search"
              />
            </div>
            <div className={styles.filterDropdown}>
              <Dropdown
                id="status-filter"
                value={statusFilter}
                options={statusOptions}
                onChange={(value) => setStatusFilter(value)}
                className={styles.statusDropdown}
              />
            </div>
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.tableWrapper}>
          {isLoading ? (
            <div className={styles.loadingState}>
              Loading transaction history...
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Details</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((txn) => (
                    <tr key={txn.id || txn._id} className={styles.tableRow}>
                      <td className={styles.idCell}>
                        <div className={styles.transactionId}>
                          #{txn.id || txn._id}
                        </div>
                        <div className={styles.reference}>
                          {txn.reason || "—"}
                        </div>
                      </td>
                      <td className={styles.detailsCell}>
                        <div className={styles.beneficiary}>
                          <FiUser className={styles.detailIcon} />
                          {txn.senderName} → {txn.recipientName}
                        </div>
                        <div className={styles.account}>
                          <FiCreditCard className={styles.detailIcon} />
                          {txn.senderAccountNumber || "—"} →{" "}
                          {txn.recipientAccountNumber || "—"}
                        </div>
                      </td>
                      <td className={styles.amountCell}>
                        {formatMoney(txn.amount, txn.currency)}
                      </td>
                      <td className={styles.dateCell}>
                        {formatDate(txn.createdAtEpoch)}
                      </td>
                      <td className={styles.statusCell}>
                        {getStatusBadge(txn.status)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className={styles.noResults}>
                      {searchTerm
                        ? "No transactions found matching your criteria"
                        : "No transaction history available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default TransactionHistory;
