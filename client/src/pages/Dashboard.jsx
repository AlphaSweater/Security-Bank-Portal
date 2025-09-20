import styles from "./Dashboard.module.css";

function Dashboard() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>📊 Dashboard</h1>
      <div className={styles.card}>
        <div className={styles.welcome}>Welcome back, Demo User!</div>
        <div className={styles.balance}>$12,500.00</div>
        <div className={styles.label}>Current Balance</div>
        <button className={styles.button}>View Transactions</button>
      </div>
    </div>
  );
}

export default Dashboard;
