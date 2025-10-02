// External Dependencies
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
  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.heading}>Dashboard</h1>
          <div className={styles.welcome}>Welcome back, Demo User! 👋</div>
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
              <Link to="/transactions" className={styles.viewAll}>
                View All
              </Link>
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
              <button className={styles.actionButton}>
                <FiDollarSign />
                <span>Transfer Money</span>
              </button>
              <button className={styles.actionButton}>
                <FiCreditCard />
                <span>Pay Bills</span>
              </button>
              <button className={styles.actionButton}>
                <FiTrendingUp />
                <span>Investments</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default DashboardPage;
