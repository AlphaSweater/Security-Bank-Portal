// External Dependencies
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiList,
  FiFileText,
  FiTrendingUp,
} from "react-icons/fi";

// Components
import { apiRequest } from "../../utils/apiUtil";

// Styles
import styles from "./DashboardPage.module.css";

function StatCard({ title, value, icon, colorClass }) {
  const Icon = icon;
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <div className={styles.statIcon}>
          <Icon />
        </div>
        <span className={styles.statTitle}>{title}</span>
      </div>
      <div className={`${styles.statValue} ${colorClass || ""}`}>{value}</div>
    </div>
  );
}

function PendingTransactionPreview({ transaction }) {
  const formatted = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(transaction.amount) || 0);

  // Format date - handle both epoch timestamps and date strings
  const formatDate = (tx) => {
    if (tx.createdAtEpoch) {
      const date = new Date(tx.createdAtEpoch);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffHours < 1) return "Just now";
      if (diffHours < 24)
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      return date.toLocaleDateString("en-ZA");
    }
    return tx.date || "Unknown date";
  };

  return (
    <Link
      to={`/transactions/review/${transaction._id}`}
      className={styles.transactionItem}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className={styles.transactionIcon}>
        <FiClock />
      </div>
      <div className={styles.transactionDetails}>
        <div className={styles.transactionName}>
          {transaction.recipient ||
            transaction.recipientAccountNumber ||
            "Unknown"}
        </div>
        <div className={styles.transactionDate}>{formatDate(transaction)}</div>
      </div>
      <div className={`${styles.statusPill} ${styles.statusPending}`}>
        Pending
      </div>
      <div className={`${styles.transactionAmount} ${styles.expense}`}>
        {formatted}
      </div>
    </Link>
  );
}

function EmployeeDashboard() {
  const [profileName, setProfileName] = useState("");
  const [isWelcomeLoading, setIsWelcomeLoading] = useState(true);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Load employee profile
  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const data = await apiRequest("/api/users/me");
        if (cancelled) return;
        const user = data?.user;
        const first = user?.firstName;
        const last = user?.lastName;
        const full = [first, last].filter(Boolean).join(" ").trim();
        setProfileName(full || "Employee");
      } catch (err) {
        if (!cancelled) setProfileName("Employee");
      } finally {
        if (!cancelled) setIsWelcomeLoading(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load pending transactions for employee review
  useEffect(() => {
    let cancelled = false;
    async function loadPendingTransactions() {
      try {
        // TODO: Replace with actual employee transactions endpoint
        // For now, using a stub endpoint that will need to be implemented
        const data = await apiRequest("/api/transactions/pending");
        if (cancelled) return;

        const items = Array.isArray(data?.transactions)
          ? data.transactions
          : [];

        // Calculate stats
        const pending = items.filter((t) => t.status === "pending").length;
        const approved = items.filter((t) => t.status === "approved").length;
        const rejected = items.filter((t) => t.status === "rejected").length;

        setStats({ pending, approved, rejected });

        // Show only pending transactions, sorted by most recent
        const pendingOnly = items
          .filter((t) => t.status === "pending")
          .sort((a, b) => (b.createdAtEpoch || 0) - (a.createdAtEpoch || 0))
          .slice(0, 5); // Show top 5

        setPendingTransactions(pendingOnly);
      } catch (err) {
        // If endpoint doesn't exist yet, fall back to empty state
        if (!cancelled) {
          setPendingTransactions([]);
          setStats({ pending: 0, approved: 0, rejected: 0 });
        }
      } finally {
        if (!cancelled) setIsTransactionsLoading(false);
      }
    }
    loadPendingTransactions();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.heading}>Employee Dashboard</h1>
          <div className={styles.welcome} aria-live="polite">
            {isWelcomeLoading ? (
              "Welcome back, ..."
            ) : (
              <>
                Welcome back,{" "}
                <span className={styles.welcomeName}>{profileName}</span>!
              </>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <StatCard
            title="Pending Review"
            value={stats.pending}
            icon={FiClock}
            colorClass={styles.pending}
          />
          <StatCard
            title="Approved Today"
            value={stats.approved}
            icon={FiCheckCircle}
            colorClass={styles.positive}
          />
          <StatCard
            title="Rejected Today"
            value={stats.rejected}
            icon={FiXCircle}
            colorClass={styles.negative}
          />
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Pending Transactions</h3>
              <Link to="/transactions/pending" className={styles.viewAll}>
                View All
              </Link>
            </div>
            <div className={styles.transactionsList}>
              {isTransactionsLoading ? (
                <div className={styles.transactionSkeleton}>
                  Loading pending transactions…
                </div>
              ) : pendingTransactions.length === 0 ? (
                <div className={styles.transactionEmpty}>
                  No pending transactions at the moment
                </div>
              ) : (
                pendingTransactions.map((transaction) => (
                  <PendingTransactionPreview
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h3>Quick Actions</h3>
            <div className={styles.quickActions}>
              <Link to="/transactions/pending" className={styles.actionButton}>
                <FiList />
                <span>Review Pending</span>
              </Link>
              <Link to="/transactions/approved" className={styles.actionButton}>
                <FiCheckCircle />
                <span>View Approved</span>
              </Link>
              <Link to="/transactions/rejected" className={styles.actionButton}>
                <FiXCircle />
                <span>View Rejected</span>
              </Link>
              <Link to="/transactions/history" className={styles.actionButton}>
                <FiFileText />
                <span>Transaction History</span>
              </Link>
              <Link to="/reports" className={styles.actionButton}>
                <FiTrendingUp />
                <span>Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmployeeDashboard;
