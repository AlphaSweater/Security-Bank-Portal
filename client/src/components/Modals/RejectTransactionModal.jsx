import React, { useState } from 'react';
import Button from '../Common/Button/Button';
import styles from './RejectTransactionModal.module.css';

const RejectTransactionModal = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const wordCount = reason.trim().split(/\s+/).filter(Boolean).length;
    
    if (wordCount < 10) {
      setError('Please provide a detailed reason (at least 10 words)');
      return;
    }

    onConfirm(reason);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h3>Confirm Rejection</h3>
        <p>Please provide a detailed reason for rejecting this transaction (minimum 10 words):</p>
        
        <form onSubmit={handleSubmit}>
          <textarea
            className={styles.reasonInput}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            rows={4}
            placeholder="Enter the reason for rejection..."
            required
          />
          
          {error && <div className={styles.errorText}>{error}</div>}
          
          <div className={styles.buttonGroup}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="danger"
            >
              Confirm Reject
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectTransactionModal;
