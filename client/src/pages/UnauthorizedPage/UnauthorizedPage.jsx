// External Dependencies
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiShield, FiHome, FiAlertTriangle } from "react-icons/fi";

// Styles
import styles from "./UnauthorizedPage.module.css";

// Animation Variants
const pageVariants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const iconVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1],
      delay: 0.2,
    },
  },
};

const contentVariants = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, delay: 0.3 },
  },
};

const buttonVariants = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, delay: 0.4 },
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
    transition: { duration: 0.2 },
  },
  tap: { scale: 0.98 },
};

export default function UnauthorizedPage() {
  return (
    <motion.div
      className={styles.page}
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className={styles.container}>
        <motion.div className={styles.iconWrapper} variants={iconVariants}>
          <div className={styles.iconBackground}>
            <FiShield className={styles.icon} />
          </div>
          <div className={styles.warningBadge}>
            <FiAlertTriangle />
          </div>
        </motion.div>

        <motion.div className={styles.content} variants={contentVariants}>
          <h1 className={styles.title}>Access Denied</h1>
          <p className={styles.subtitle}>
            You don't have permission to view this page
          </p>
          <p className={styles.description}>
            This area is restricted to authorized users only. If you believe you
            should have access, please contact your administrator or try logging
            in with a different account.
          </p>
        </motion.div>

        <motion.div className={styles.buttonGroup} variants={buttonVariants}>
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Link to="/" className={styles.primaryButton}>
              <FiHome />
              <span>Return to Home</span>
            </Link>
          </motion.div>

          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Link to="/auth" className={styles.secondaryButton}>
              <span>Sign In</span>
            </Link>
          </motion.div>
        </motion.div>

        <div className={styles.errorCode}>
          <span className={styles.errorCodeText}>Error 403</span>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className={styles.bgDecoration1}></div>
      <div className={styles.bgDecoration2}></div>
      <div className={styles.bgDecoration3}></div>
    </motion.div>
  );
}
