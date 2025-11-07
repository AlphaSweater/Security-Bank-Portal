// External Dependencies
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCreditCard,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

// Components
import { apiRequest } from "../../utils/apiUtil";
import TransactionItem from "../../components/Common/TransactionItem";

// Styles
import styles from "./DashboardPage.module.css";

function StatCard({ title, value, icon, variant, isCurrency }) {
  const Icon = icon;

  const displayValue = isCurrency
    ? new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value) || 0)
    : value;

  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <div className={styles.statIcon}>
          <Icon />
        </div>
        <span className={styles.statTitle}>{title}</span>
      </div>
      <div className={`${styles.statValue} ${variant ? styles[variant] : ""}`}>
        {displayValue}
      </div>
    </div>
  );
}

function CustomerDashboard() {
  const [isWorkInProgressOpen, setIsWorkInProgressOpen] = useState(false);
  const [workInProgressMessage, setWorkInProgressMessage] = useState(
    "This feature is a work in progress and will be implemented later."
  );
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await apiRequest(
          `/api/customers/dashboard?limit=${itemsPerPage + 1}`,
          {
            method: "GET",
          }
        );

        if (cancelled) return;

        // Check if there are more items for pagination
        const items = data?.transactions?.items || [];
        const hasMoreItems = items.length > itemsPerPage;

        // Store only the items for current page
        if (hasMoreItems) {
          data.transactions.items = items.slice(0, itemsPerPage);
        }

        setHasMore(hasMoreItems);
        setDashboardData(data);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  function openWorkInProgress(message) {
    if (message) setWorkInProgressMessage(message);
    setIsWorkInProgressOpen(true);
  }

  function closeWorkInProgress() {
    setIsWorkInProgressOpen(false);
  }

  async function loadPage(page) {
    if (page < 1) return;

    try {
      setIsLoading(true);
      setError(null);
      setCurrentPage(page);

      // Calculate cursor for pagination
      const allTransactions = dashboardData?.transactions?.items || [];
      const startIndex = (page - 1) * itemsPerPage;

      // If we already have the data, just paginate locally
      if (allTransactions.length >= startIndex + itemsPerPage || page === 1) {
        // Use local data
        setIsLoading(false);
        return;
      }

      // Otherwise fetch new data with cursor
      const lastTransaction = allTransactions[allTransactions.length - 1];
      const after = lastTransaction
        ? `${lastTransaction.createdAtEpoch}:${lastTransaction._id}`
        : undefined;

      const data = await apiRequest(
        `/api/customers/dashboard?limit=${itemsPerPage + 1}${
          after ? `&after=${after}` : ""
        }`,
        {
          method: "GET",
        }
      );

      // Check if there are more items
      const items = data?.transactions?.items || [];
      const hasMoreItems = items.length > itemsPerPage;

      if (hasMoreItems) {
        data.transactions.items = items.slice(0, itemsPerPage);
      }

      setHasMore(hasMoreItems);
      setDashboardData(data);
    } catch (err) {
      setError(err.message || "Failed to load page");
    } finally {
      setIsLoading(false);
    }
  }

  function handlePreviousPage() {
    if (currentPage > 1) {
      loadPage(currentPage - 1);
    }
  }

  function handleNextPage() {
    if (hasMore) {
      loadPage(currentPage + 1);
    }
  }

  // Derived data
  const user = dashboardData?.user || {};
  const profileName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "User";

  const summary = dashboardData?.summary || { total: 0, byStatus: {} };
  const monthStats = dashboardData?.monthStats || { count: 0, totalVolume: 0 };
  const recentTransactions = dashboardData?.transactions?.items || [];

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.heading}>Dashboard</h1>
          <div className={styles.welcome} aria-live="polite">
            {isLoading ? (
              "Welcome back, ..."
            ) : (
              <>
                Welcome back,{" "}
                <span className={styles.welcomeName}>{profileName}</span>!
              </>
            )}
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className={styles.statsGrid}>
          <StatCard
            title="Transactions This Month"
            value={monthStats.count}
            icon={FiCalendar}
          />
          <StatCard
            title="Sent This Month"
            value={monthStats.totalVolume}
            icon={FiDollarSign}
            isCurrency
          />
          <StatCard
            title="Pending Transactions"
            value={summary.byStatus?.pending || 0}
            icon={FiClock}
            variant="warning"
          />
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Your Transactions</h3>
              <div className={styles.paginationInfo}>Page {currentPage}</div>
            </div>
            <div className={styles.transactionsList}>
              {isLoading ? (
                <div className={styles.transactionSkeleton}>
                  Loading transactions…
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className={styles.transactionEmpty}>
                  No transactions found
                </div>
              ) : (
                recentTransactions.map((transaction) => (
                  <TransactionItem
                    key={transaction._id || transaction.createdAtEpoch}
                    tx={transaction}
                    forceExpense
                  />
                ))
              )}
            </div>
            {!isLoading && recentTransactions.length > 0 && (
              <div className={styles.paginationControls}>
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={styles.paginationButton}
                  aria-label="Previous page"
                >
                  <FiChevronLeft />
                  <span>Previous</span>
                </button>
                <span className={styles.pageIndicator}>Page {currentPage}</span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                  className={styles.paginationButton}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <FiChevronRight />
                </button>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h3>Quick Actions</h3>
            <div className={styles.quickActions}>
              <Link to="/transaction" className={styles.actionButton}>
                <FiDollarSign />
                <span>Transfer Money</span>
              </Link>
              <button
                type="button"
                onClick={() =>
                  openWorkInProgress("Bill payments are a work in progress.")
                }
                className={styles.actionButton}
              >
                <FiCreditCard />
                <span>Pay Bills</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  openWorkInProgress("Investments will be available soon.")
                }
                className={styles.actionButton}
              >
                <FiTrendingUp />
                <span>Investments</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      {isWorkInProgressOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Work in progress message"
          className={styles.modalOverlay}
          onClick={closeWorkInProgress}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Coming soon</h4>
              <button
                onClick={closeWorkInProgress}
                aria-label="Close"
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>{workInProgressMessage}</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={closeWorkInProgress}
                className={styles.modalPrimaryButton}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;
