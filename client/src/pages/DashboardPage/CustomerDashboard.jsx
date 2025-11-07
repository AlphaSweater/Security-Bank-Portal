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
  const [nextCursor, setNextCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]); // cursor for each page start (page 1 starts at null)
  const itemsPerPage = 3;

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await apiRequest(
          `/api/customers/dashboard?limit=${itemsPerPage}`,
          { method: "GET" }
        );

        if (cancelled) return;

        // Use server-provided cursor for pagination
        setNextCursor(data?.transactions?.nextCursor || null);
        setHasMore(!!data?.transactions?.nextCursor);
        setCursorStack([null]);
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

      // Determine navigation direction
      const goingNext = page > currentPage;
      const goingPrev = page < currentPage;

      let afterCursor = null;
      if (page === 1) {
        afterCursor = null;
      } else if (goingNext) {
        afterCursor = nextCursor;
      } else if (goingPrev) {
        // Use the stored cursor for the target page
        afterCursor = cursorStack[page - 1] || null;
      }

      const data = await apiRequest(
        `/api/customers/dashboard?limit=${itemsPerPage}${afterCursor ? `&after=${encodeURIComponent(afterCursor)}` : ""}`,
        { method: "GET" }
      );

      // Update cursors and state
      const newNextCursor = data?.transactions?.nextCursor || null;
      setNextCursor(newNextCursor);
      setHasMore(!!newNextCursor);

      if (goingNext) {
        setCursorStack((prev) => [...prev, afterCursor]);
      } else if (goingPrev) {
        setCursorStack((prev) => prev.slice(0, page));
      } else {
        setCursorStack([null]);
      }

      setDashboardData(data);
      setCurrentPage(page);
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
