// External Dependencies
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiList,
  FiFileText,
  FiTrendingUp,
  FiAlertTriangle,
  FiActivity,
  FiDollarSign,
} from "react-icons/fi";

// Components
import { apiRequest } from "../../utils/apiUtil";
import Button from "../../components/Common/Button/Button";

// Styles
import styles from "./DashboardPage.module.css";

function StatCard({ title, value, icon, colorClass, subtitle }) {
  const Icon = icon;
  // Convert value to string for tooltip
  const valueStr = typeof value === "number" ? value.toString() : value;

  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <div className={styles.statIcon}>
          <Icon />
        </div>
        <span className={styles.statTitle}>{title}</span>
      </div>
      <div
        className={`${styles.statValue} ${colorClass || ""}`}
        title={valueStr}
      >
        {value}
      </div>
      {subtitle && (
        <div className={styles.statSubtitle} title={subtitle}>
          {subtitle}
        </div>
      )}
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
      const date = new Date(tx.createdAtEpoch * 1000);
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

  const getRiskBadge = (riskLevel) => {
    if (!riskLevel || riskLevel === "none") return null;

    const riskClasses = {
      high: styles.riskHigh,
      medium: styles.riskMedium,
      low: styles.riskLow,
    };

    return (
      <span className={`${styles.riskBadge} ${riskClasses[riskLevel] || ""}`}>
        {riskLevel.toUpperCase()}
      </span>
    );
  };

  const recipientName =
    transaction.recipient || transaction.recipientAccountNumber || "Unknown";

  return (
    <Link
      to={`/transactions/review/${transaction.id}`}
      className={styles.transactionItem}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className={styles.transactionIcon}>
        <FiClock />
      </div>
      <div className={styles.transactionDetails}>
        <div className={styles.transactionName} title={recipientName}>
          {recipientName}
        </div>
        <div className={styles.transactionDate}>{formatDate(transaction)}</div>
      </div>
      <div className={styles.transactionBadges}>
        {getRiskBadge(transaction.riskLevel)}
        <span className={`${styles.statusPill} ${styles.statusPending}`}>
          Pending
        </span>
      </div>
      <div
        className={`${styles.transactionAmount} ${styles.expense}`}
        title={formatted}
      >
        {formatted}
      </div>
    </Link>
  );
}

function EmployeeDashboard({ role }) {
  const [profileName, setProfileName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState("");

  // Fetch dashboard data from the new unified endpoint
  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const [userResponse, dashboardResponse] = await Promise.all([
        apiRequest("/api/users/me"),
        apiRequest("/api/employees/dashboard"),
      ]);

      // Set user profile
      const user = userResponse?.user;
      const firstName = user?.firstName;
      const lastName = user?.lastName;
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
      setProfileName(fullName || "Employee");

      // Set dashboard data
      setDashboardData(dashboardResponse);
    } catch (err) {
      setError(err?.message || "Failed to load dashboard");
      // eslint-disable-next-line no-console
      console.error("Failed to load dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  // Calculate stats from dashboard data
  const stats = dashboardData
    ? {
        pending: dashboardData.overview?.pendingCount || 0,
        approvalRate: dashboardData.metrics?.approvalRate || 0,
        rejectionRate: dashboardData.metrics?.rejectionRate || 0,
        totalVolume: dashboardData.overview?.totalVolume || 0,
        totalTransactions: dashboardData.overview?.totalTransactions || 0,
        avgReviewTime: dashboardData.myPerformance?.avgReviewTime || 0,
        myTotal: dashboardData.myPerformance?.total || 0,
        myApprovalRate: dashboardData.myPerformance?.approvalRate || 0,
      }
    : null;

  const pendingTransactions = dashboardData?.queue?.recentItems || [];
  const queueStats = dashboardData?.queue?.stats || {};
  const systemHealth = dashboardData?.systemHealth || {};
  const riskDistribution = dashboardData?.riskDistribution || {};

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.heading}>
            {role === "admin" ? "Admin Dashboard" : "Employee Dashboard"}
          </h1>
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

        {/* System Health Alert */}
        {systemHealth.status === "attention_needed" && (
          <div className={styles.healthAlert} role="alert">
            <FiAlertTriangle />
            <div>
              <strong>Attention Needed:</strong> {systemHealth.message}
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        {isLoading ? (
          <div className={styles.statsGrid}>
            <div className={styles.statSkeleton}>Loading...</div>
            <div className={styles.statSkeleton}>Loading...</div>
            <div className={styles.statSkeleton}>Loading...</div>
            <div className={styles.statSkeleton}>Loading...</div>
          </div>
        ) : error ? (
          <div className={styles.errorCard} role="alert">
            <div>{error}</div>
            <Button
              variant="outline"
              onClick={fetchDashboard}
              className={styles.retryButton}
            >
              Retry
            </Button>
          </div>
        ) : stats ? (
          <>
            <div className={styles.statsGrid}>
              <StatCard
                title="Pending Review"
                value={stats.pending}
                icon={FiClock}
                colorClass={styles.pending}
              />
              <StatCard
                title="System Approval Rate"
                value={`${stats.approvalRate}%`}
                icon={FiCheckCircle}
                colorClass={styles.positive}
                subtitle={`${stats.rejectionRate}% rejected`}
              />
              <StatCard
                title="Total Volume"
                value={formatCurrency(stats.totalVolume)}
                icon={FiDollarSign}
                colorClass={styles.neutral}
                subtitle={`${stats.totalTransactions} transactions`}
              />
              <StatCard
                title="My Performance"
                value={`${stats.myApprovalRate}%`}
                icon={FiActivity}
                colorClass={styles.highlight}
                subtitle={`${stats.myTotal} reviewed • ${
                  stats.avgReviewTime || 0
                }min avg`}
              />
            </div>

            {/* Risk Distribution */}
            {(riskDistribution.high > 0 ||
              riskDistribution.medium > 0 ||
              riskDistribution.low > 0) && (
              <div className={styles.riskOverview}>
                <h3>Risk Distribution</h3>
                <div className={styles.riskStats}>
                  {riskDistribution.high > 0 && (
                    <div className={styles.riskStat}>
                      <span className={styles.riskHigh}>High</span>
                      <span className={styles.riskCount}>
                        {riskDistribution.high}
                      </span>
                    </div>
                  )}
                  {riskDistribution.medium > 0 && (
                    <div className={styles.riskStat}>
                      <span className={styles.riskMedium}>Medium</span>
                      <span className={styles.riskCount}>
                        {riskDistribution.medium}
                      </span>
                    </div>
                  )}
                  {riskDistribution.low > 0 && (
                    <div className={styles.riskStat}>
                      <span className={styles.riskLow}>Low</span>
                      <span className={styles.riskCount}>
                        {riskDistribution.low}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : null}

        <div className={styles.dashboardGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Pending Transactions</h3>
              <Link to="/transactions/pending" className={styles.viewAll}>
                View All ({stats?.pending || 0})
              </Link>
            </div>
            <div className={styles.transactionsList}>
              {isLoading ? (
                <div className={styles.transactionSkeleton}>
                  Loading pending transactions…
                </div>
              ) : error ? (
                <div className={styles.transactionError} role="alert">
                  <div>{error}</div>
                  <Button
                    variant="outline"
                    onClick={fetchDashboard}
                    className={styles.retryButton}
                  >
                    Retry
                  </Button>
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
            <h3>
              {role === "admin" ? "Admin Quick Actions" : "Quick Actions"}
            </h3>
            <div className={styles.quickActions}>
              <Link to="/transactions/pending" className={styles.actionButton}>
                <FiList />
                <span>Review Pending</span>
                {stats && stats.pending > 0 && (
                  <span className={styles.badge}>{stats.pending}</span>
                )}
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
              {role === "admin" && (
                <Link to="/admin/employees" className={styles.actionButton}>
                  <FiList />
                  <span>Manage Employees</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmployeeDashboard;
