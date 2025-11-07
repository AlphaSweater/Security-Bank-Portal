import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiCheckCircle, FiXCircle, FiSearch, FiDollarSign, FiUser, FiCreditCard, FiFileText } from 'react-icons/fi';
import SearchBar from '../../components/SearchBar/SearchBar';
import Dropdown from '../../components/Common/Dropdown/Dropdown';
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
      status: 'pending',
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

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // Status filter options for dropdown
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' }
  ];


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

  const getStatusBadge = (status) => {
    const statusClasses = {
      completed: styles.statusCompleted,
      pending: styles.statusPending,
      failed: styles.statusFailed
    };

    const statusIcons = {
      completed: <FiCheckCircle className={styles.statusIcon} />,
      pending: <FiClock className={styles.statusIcon} />,
      failed: <FiXCircle className={styles.statusIcon} />
    };

    return (
      <span className={`${styles.statusBadge} ${statusClasses[status] || ''}`}>
        {statusIcons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Domestic Transfer':
        return <FiDollarSign className={styles.typeIcon} />;
      case 'International Transfer':
        return <FiCreditCard className={styles.typeIcon} />;
      case 'Bill Payment':
        return <FiFileText className={styles.typeIcon} />;
      default:
        return <FiDollarSign className={styles.typeIcon} />;
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      // Filter by status
      if (statusFilter !== 'all' && txn.status !== statusFilter) {
        return false;
      }

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          txn.id.toLowerCase().includes(searchLower) ||
          txn.beneficiary.toLowerCase().includes(searchLower) ||
          txn.accountNumber.toLowerCase().includes(searchLower) ||
          txn.reference.toLowerCase().includes(searchLower) ||
          txn.amount.toString().includes(searchTerm)
        );
      }

      return true;
    });
  }, [transactions, searchTerm, statusFilter]);

  return (
  <div className={styles.pageWrapper}>
    <main className={styles.mainContent}>
      <div className={styles.topBar}>
        <Link to="/dashboard" className={styles.backLink}>
          <FiArrowLeft className={styles.backIcon} /> Back to Dashboard
        </Link>
      </div>

      <header className={styles.pageHeader}>
        <h1 className={styles.heading}>Transaction History</h1>
        <div className={styles.subheading}>
          <span className={styles.iconPill} aria-hidden>
            <FiFileText />
          </span>
          View and manage all transactions
        </div>
      </header>

        <div className={styles.toolbar}>
          <div className={styles.searchAndFilter}>
            <div className={styles.searchBox}>
              <FiSearch aria-hidden />
              <input
                id="transactionSearch"
                aria-label="Search transactions"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                type="search"
              />
            </div>
            <div className={styles.filterDropdown}>
              <Dropdown
                id="status-filter"
                value={statusFilter}
                options={statusOptions}
                onChange={(value) => setStatusFilter(value)}
                className={styles.statusDropdown}
              />
            </div>
          </div>
        </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Type</th>
              <th>Details</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((txn) => (
                <tr key={txn.id} className={styles.tableRow}>
                  <td className={styles.idCell}>
                    <div className={styles.transactionId}>#{txn.id}</div>
                    <div className={styles.reference}>{txn.reference}</div>
                  </td>
                  <td className={styles.typeCell}>
                    <div className={styles.typeWrapper}>
                      {getTypeIcon(txn.type)}
                      <span>{txn.type}</span>
                    </div>
                  </td>
                  <td className={styles.detailsCell}>
                    <div className={styles.beneficiary}>
                      <FiUser className={styles.detailIcon} />
                      {txn.beneficiary}
                    </div>
                    <div className={styles.account}>
                      <FiCreditCard className={styles.detailIcon} />
                      {txn.accountNumber}
                    </div>
                  </td>
                  <td className={styles.amountCell}>
                    ${txn.amount.toFixed(2)}
                  </td>
                  <td className={styles.dateCell}>
                    {formatDate(txn.date)}
                  </td>
                  <td className={styles.statusCell}>
                    {getStatusBadge(txn.status)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className={styles.noResults}>
                  No transactions found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </main>
    </div>
  );
};

export default TransactionHistory;
