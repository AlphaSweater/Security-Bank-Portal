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

// Styles
import styles from "./DashboardPage.module.css";

// Mock data - replace with actual data from your API
const accountData = {
  balance: 12500.0,
  income: 4850.0,
  expenses: 2350.0,
  recentTransactions: [
    {
      id: 1,
      name: "Salary",
      amount: 4500.0,
      type: "income",
      date: "2025-10-01",
    },
    {
      id: 2,
      name: "Grocery Store",
      amount: -156.78,
      type: "expense",
      date: "2025-10-01",
    },
    {
      id: 3,
      name: "Electric Bill",
      amount: -89.99,
      type: "expense",
      date: "2025-09-30",
    },
  ],
};

function StatCard({ title, value, change, isPositive, icon: Icon }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <div className={styles.statIcon}>
          <Icon />
        </div>
        <span className={styles.statTitle}>{title}</span>
      </div>
      <div className={styles.statValue}>
        $
        {value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
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

function TransactionItem({ transaction }) {
  const isIncome = transaction.amount > 0;
  const formattedAmount = isIncome
    ? `+$${Math.abs(transaction.amount).toFixed(2)}`
    : `-$${Math.abs(transaction.amount).toFixed(2)}`;

  return (
    <div className={styles.transactionItem}>
      <div className={styles.transactionIcon}>
        {isIncome ? <FiDollarSign /> : <FiCreditCard />}
      </div>
      <div className={styles.transactionDetails}>
        <div className={styles.transactionName}>{transaction.name}</div>
        <div className={styles.transactionDate}>
          {new Date(transaction.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
      <div
        className={`${styles.transactionAmount} ${
          isIncome ? styles.income : styles.expense
        }`}
      >
        {formattedAmount}
      </div>
    </div>
  );
}

function DashboardPage() {
  const [wipOpen, setWipOpen] = useState(false);
  const [wipMessage, setWipMessage] = useState(
    "This feature is a work in progress and will be implemented later."
  );
  const [profileName, setProfileName] = useState("");
  const [welcomeLoading, setWelcomeLoading] = useState(true);

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
            value={accountData.balance}
            change={2.4}
            isPositive={true}
            icon={FiDollarSign}
          />
          <StatCard
            title="Income"
            value={accountData.income}
            change={5.2}
            isPositive={true}
            icon={FiTrendingUp}
          />
          <StatCard
            title="Expenses"
            value={accountData.expenses}
            change={1.8}
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
              {accountData.recentTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
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
