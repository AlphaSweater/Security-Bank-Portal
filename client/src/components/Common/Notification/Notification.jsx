import { useEffect } from 'react';
import styles from './Notification.module.css';

const Notification = ({ type, message, onClose, autoClose = true, autoCloseTime = 5000 }) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, onClose]);

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <div className={styles.message}>{message}</div>
      <button className={styles.closeButton} onClick={onClose}>&times;</button>
    </div>
  );
};

export default Notification;
