// External Dependencies
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowUpRight,
  FiArrowDownRight,
  FiCreditCard,
  FiDollarSign,
  FiTrendingUp,
} from "react-icons/fi";

// Components
import Footer from "../../components/Footer/Footer";
import { apiRequest } from "../../utils/apiUtil";
import TransactionItem from "../../components/Common/TransactionItem";

// Styles
import styles from "./DashboardPage.module.css";

function StatCard({ title, value, change, isPositive, icon: Icon }) {
  const formatted = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <div className={styles.statIcon}>
          <Icon />
        </div>
        <span className={styles.statTitle}>{title}</span>
      </div>
      <div
        className={`${styles.statValue} ${
          isPositive === true
            ? styles.positive
            : isPositive === false
            ? styles.negative
            : ""
        }`}
      >
        {formatted}
      </div>
      {change !== undefined && (
        <div
          className={`${styles.statChange} ${
            isPositive ? styles.positive : styles.negative
          }`}
        >
          {isPositive ? <FiArrowUpRight /> : <FiArrowDownRight />}
          {Math.abs(change)}% from last month
        </div>
      )}
    </div>
  );
}

// TransactionItem is now a shared component

function DashboardPage() {
  const [wipOpen, setWipOpen] = useState(false);
  const [wipMessage, setWipMessage] = useState(
    "This feature is a work in progress and will be implemented later."
  );
  const [profileName, setProfileName] = useState("");
  const [welcomeLoading, setWelcomeLoading] = useState(true);
  const [recentTxns, setRecentTxns] = useState([]);
  const [txnsLoading, setTxnsLoading] = useState(true);
  const [totals, setTotals] = useState({ income: 0, expenses: 0, balance: 0 });

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
        setProfileName(full || "User");
      } catch (e) {
        // Keep a graceful fallback if profile fetch fails
        setProfileName("User");
      } finally {
        if (!cancelled) setWelcomeLoading(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadTransactions() {
      try {
        const data = await apiRequest("/api/users/me/transactions");
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        // Compute summary totals
        const income = 0; // not implemented yet
        const expenses = items.reduce(
          (sum, t) => sum + (Number(t.amount) || 0),
          0
        );
        const balance = income - expenses;
        setTotals({ income, expenses, balance });
        const sorted = items
          .slice()
          .sort((a, b) => (b.createdAtEpoch || 0) - (a.createdAtEpoch || 0));
        setRecentTxns(sorted.slice(0, 3));
      } catch (e) {
        setRecentTxns([]);
        setTotals({ income: 0, expenses: 0, balance: 0 });
      } finally {
        if (!cancelled) setTxnsLoading(false);
      }
    }
    loadTransactions();
    return () => {
      cancelled = true;
    };
  }, []);

  function openWip(message) {
    if (message) setWipMessage(message);
    setWipOpen(true);
  }

  function closeWip() {
    setWipOpen(false);
  }

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.heading}>Dashboard</h1>
          <div className={styles.welcome} aria-live="polite">
            {welcomeLoading ? (
              "Welcome back, …"
            ) : (
              <>
                Welcome back,{" "}
                <span className={styles.welcomeName}>{profileName}</span>! 👋
              </>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <StatCard
            title="Total Balance"
            value={totals.balance}
            isPositive={totals.balance >= 0}
            icon={FiDollarSign}
          />
          <StatCard title="Income" value={totals.income} icon={FiTrendingUp} />
          <StatCard
            title="Expenses"
            value={totals.expenses}
            isPositive={false}
            icon={FiCreditCard}
          />
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Recent Transactions</h3>
              <button
                type="button"
                className={styles.viewAll}
                onClick={() =>
                  openWip("The full transactions list is coming soon.")
                }
              >
                View All
              </button>
            </div>
            <div className={styles.transactionsList}>
              {txnsLoading ? (
                <div className={styles.transactionSkeleton}>
                  Loading transactions…
                </div>
              ) : recentTxns.length === 0 ? (
                <div className={styles.transactionEmpty}>
                  No recent transactions
                </div>
              ) : (
                recentTxns.map((tx) => (
                  <TransactionItem
                    key={tx._id || tx.createdAtEpoch}
                    tx={tx}
                    forceExpense
                  />
                ))
              )}
            </div>
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
                onClick={() => openWip("Bill payments are a work in progress.")}
                className={styles.actionButton}
              >
                <FiCreditCard />
                <span>Pay Bills</span>
              </button>
              <button
                type="button"
                onClick={() => openWip("Investments will be available soon.")}
                className={styles.actionButton}
              >
                <FiTrendingUp />
                <span>Investments</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      {wipOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Work in progress message"
          className={styles.modalOverlay}
          onClick={closeWip}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Coming soon</h4>
              <button
                onClick={closeWip}
                aria-label="Close"
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>{wipMessage}</p>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={closeWip} className={styles.modalPrimaryButton}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default DashboardPage;
