import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import styles from './TransactionHistory.module.css';

const TransactionHistory = () => {
  // Mock data for demonstration
  const [transactions] = useState([
    {
      id: 'TXN1001',
      date: '2025-10-28T10:30:00',
      type: 'Domestic Transfer',
      amount: 1250.75,
      status: 'completed',
      beneficiary: 'John Smith',
      accountNumber: '****3456',
      reference: 'Rent payment'
    },
    {
      id: 'TXN1002',
      date: '2025-10-25T14:15:00',
      type: 'International Transfer',
      amount: 500.00,
      status: 'completed',
      beneficiary: 'Maria Garcia',
      accountNumber: '****7890',
      reference: 'Gift'
    },
    {
      id: 'TXN1003',
      date: '2025-10-20T09:45:00',
      type: 'Bill Payment',
      amount: 89.99,
      status: 'completed',
      beneficiary: 'Electric Company',
      accountNumber: 'UTIL-12345',
      reference: 'Monthly bill'
    },
    {
      id: 'TXN1004',
      date: '2025-10-15T16:20:00',
      type: 'Domestic Transfer',
      amount: 200.00,
      status: 'failed',
      beneficiary: 'Robert Johnson',
      accountNumber: '****9012',
      reference: 'Dinner',
      failureReason: 'Insufficient funds'
    },
    {
      id: 'TXN1005',
      date: '2025-10-10T11:05:00',
      type: 'International Transfer',
      amount: 1000.00,
      status: 'completed',
      beneficiary: 'Chen Wei',
      accountNumber: '****5678',
      reference: 'Business payment'
    }
  ]);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className={styles.completedIcon} />;
      case 'failed':
        return <FiXCircle className={styles.failedIcon} />;
      default:
        return <FiClock className={styles.pendingIcon} />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/dashboard" className={styles.backLink}>
          <FiArrowLeft className={styles.backIcon} /> Back to Dashboard
        </Link>
        <h1>Transaction History</h1>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input 
            type="text" 
            placeholder="Search transactions..."
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <select className={styles.filterSelect}>
            <option value="">All Types</option>
            <option value="domestic">Domestic Transfer</option>
            <option value="international">International Transfer</option>
            <option value="bill">Bill Payment</option>
          </select>
          <select className={styles.filterSelect}>
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className={styles.transactionsList}>
        {transactions.map((txn) => (
          <div key={txn.id} className={`${styles.transactionCard} ${styles[txn.status]}`}>
            <div className={styles.transactionHeader}>
              <div className={styles.transactionInfo}>
                <span className={styles.transactionId}>#{txn.id}</span>
                <span className={styles.transactionType}>{txn.type}</span>
              </div>
              <div className={styles.transactionAmount}>
                ${txn.amount.toFixed(2)}
              </div>
            </div>
            
            <div className={styles.transactionDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Date:</span>
                <span>{formatDate(txn.date)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Beneficiary:</span>
                <span>{txn.beneficiary}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Account:</span>
                <span>{txn.accountNumber}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Reference:</span>
                <span>{txn.reference}</span>
              </div>
              {txn.failureReason && (
                <div className={`${styles.detailRow} ${styles.failureReason}`}>
                  <span className={styles.detailLabel}>Reason:</span>
                  <span>{txn.failureReason}</span>
                </div>
              )}
            </div>
            
            <div className={styles.transactionFooter}>
              <div className={styles.statusBadge}>
                {getStatusIcon(txn.status)}
                <span>{txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}</span>
              </div>
              <button className={styles.viewButton}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
