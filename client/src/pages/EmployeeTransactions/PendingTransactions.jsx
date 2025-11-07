import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiClock, FiEye } from "react-icons/fi";
import Button from "../../components/Common/Button/Button";
import SearchBar from "../../components/SearchBar/SearchBar";
import Dropdown from "../../components/Common/Dropdown/Dropdown";
import styles from "./PendingTransactions.module.css";

const mockPending = [
  {
    id: "TXN-102938",
    sender: "Acme Corp",
    recipient: "John Smith",
    amount: 2500.0,
    currency: "ZAR",
    riskLevel: "high",
    createdAt: "2025-11-04 09:15",
  },
  {
    id: "TXN-102939",
    sender: "Jane Doe",
    recipient: "Mike Johnson",
    amount: 1800.5,
    currency: "USD",
    riskLevel: "medium",
    createdAt: "2025-11-04 08:05",
  },
  {
    id: "TXN-102940",
    sender: "Contoso Ltd",
    recipient: "Alice Brown",
    amount: 5200.75,
    currency: "EUR",
    riskLevel: "low",
    createdAt: "2025-11-03 17:42",
  },
  {
    id: "TXN-102941",
    sender: "Global Corp",
    recipient: "David Wilson",
    amount: 3200.0,
    currency: "ZAR",
    riskLevel: "high",
    createdAt: "2025-11-03 14:30",
  },
  {
    id: "TXN-102942",
    sender: "Tech Solutions",
    recipient: "Sarah Miller",
    amount: 1200.0,
    currency: "USD",
    riskLevel: "medium",
    createdAt: "2025-11-03 10:15",
  },
];

function formatMoney(value) {
  const num = Number(value) || 0;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const PendingTransactions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const riskOptions = [
    { value: "all", label: "All Risk Levels" },
    { value: "high", label: "High Risk" },
    { value: "medium", label: "Medium Risk" },
    { value: "low", label: "Low Risk" },
  ];

  const getRiskBadge = (riskLevel) => {
    const riskClasses = {
      high: `${styles.statusPill} ${styles.riskHigh}`,
      medium: `${styles.statusPill} ${styles.riskMedium}`,
      low: `${styles.statusPill} ${styles.riskLow}`
    };
    
    const riskLabels = {
      high: "High Risk",
      medium: "Medium Risk",
      low: "Low Risk"
    };
    
    return (
      <span className={riskClasses[riskLevel] || ''}>
        {riskLabels[riskLevel] || riskLevel}
      </span>
    );
  };

  const filteredPending = useMemo(() => {
    return mockPending.filter(txn => {
      // Search term filter
      const matchesSearch = !searchTerm.trim() || 
        txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.amount.toString().includes(searchTerm);
      
      // Risk level filter
      const matchesRisk = riskFilter === "all" || txn.riskLevel === riskFilter;
      
      return matchesSearch && matchesRisk;
    });
  }, [searchTerm, riskFilter]);
  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <Link to="/dashboard" className={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1 className={styles.heading}>Pending Transactions</h1>
          <div className={styles.subheading}>
            <span className={styles.iconPill} aria-hidden="true">
              <FiClock />
            </span>
            Review transactions awaiting approval
          </div>

          <div className={styles.toolbar}>
            <div className={styles.searchAndFilter}>
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder="Search pending transactions..."
                className={styles.searchBar}
              />
              <div className={styles.filterDropdown}>
                <Dropdown
                  id="risk-filter"
                  value={riskFilter}
                  options={riskOptions}
                  onChange={(value) => setRiskFilter(value)}
                  className={styles.riskDropdown}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Queue</h3>
            <div className={styles.queueCount}>
              {filteredPending.length} pending
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Sender</th>
                  <th>Recipient</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPending.length > 0 ? (
                  filteredPending.map((t) => (
                  <tr key={t.id}>
                    <td className={styles.mono}>{t.id}</td>
                    <td>{t.sender}</td>
                    <td>{t.recipient}</td>
                    <td>{formatMoney(t.amount)}</td>
                    <td>{t.currency}</td>
                    <td>{t.createdAt}</td>
                    <td>
                      {getRiskBadge(t.riskLevel)}
                    </td>
                    <td>
                      <Button size="small" variant="outline" aria-label={`View ${t.id}`} onClick={() => navigate(`/transactions/review/${t.id}`)} icon={FiEye}>
                        View
                      </Button>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className={styles.noResults}>
                      {searchTerm || currencyFilter !== 'all' 
                        ? 'No pending transactions match your criteria' 
                        : 'No pending transactions found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {mockPending.length === 0 && (
              <div className={styles.emptyState}>No pending transactions</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PendingTransactions;
