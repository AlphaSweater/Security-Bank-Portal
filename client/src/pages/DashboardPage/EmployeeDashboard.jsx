// External Dependencies
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiList,
  FiFileText,
  FiTrendingUp,
} from "react-icons/fi";

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
      <div className={`${styles.statValue} ${colorClass || ""}`}>
        {value}
      </div>
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

  return (
    <div className={styles.transactionItem}>
      <div className={styles.transactionIcon}>
        <FiClock />
      </div>
      <div className={styles.transactionDetails}>
        <div className={styles.transactionName}>{transaction.recipient}</div>
        <div className={styles.transactionDate}>{transaction.date}</div>
      </div>
      <div className={`${styles.statusPill} ${styles.statusPending}`}>
        Pending
      </div>
      <div className={`${styles.transactionAmount} ${styles.expense}`}>
        {formatted}
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  // Mock data for UI demonstration - replace with real data later
  const [stats] = useState({
    pending: 12,
    approved: 47,
    rejected: 8,
  });

  const [pendingTransactions] = useState([
    {
      id: "1",
      recipient: "John Smith",
      amount: 2500.0,
      date: "2 hours ago",
    },
    {
      id: "2",
      recipient: "Jane Doe",
      amount: 1800.5,
      date: "4 hours ago",
    },
    {
      id: "3",
      recipient: "Mike Johnson",
      amount: 5200.75,
      date: "6 hours ago",
    },
  ]);

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.heading}>Employee Dashboard</h1>
          <div className={styles.welcome} aria-live="polite">
            Welcome back, <span className={styles.welcomeName}>Employee</span>!
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
              {pendingTransactions.length === 0 ? (
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
                <FiCheckCircle />
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
