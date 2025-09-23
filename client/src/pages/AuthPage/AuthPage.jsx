// External Dependencies
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Assets
import reactLogo from "../../assets/react.svg";

// UI Components
import AuthForms from "components/AuthForms";

// Styles
import styles from "./AuthPage.module.css";

// Animation Variants
const slideVariants = {
  initial: (direction) => ({
    x: direction > 0 ? 150 : -150,
    opacity: 0,
    width: "100%",
  }),
  animate: {
    x: 0,
    opacity: 1,
    width: "100%",
    transition: { duration: 0.18, ease: "easeInOut" },
  },
  exit: (direction) => ({
    x: direction < 0 ? 150 : -150,
    opacity: 0,
    width: "100%",
    transition: { duration: 0.18, ease: "easeInOut" },
  }),
};

// Default Function Export
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [direction, setDirection] = useState(1); // 1 → right, -1 → left

  const handleSwap = () => {
    setDirection(isLogin ? 1 : -1);
    setIsLogin((v) => !v);
  };

  return (
    <section className={styles.page}>
      <div className={styles.contentRow}>
        {/* Hero Area */}
        <div className={styles.heroArea}>
          <img src={reactLogo} alt="React logo" className={styles.heroLogo} />

          <h1 className={styles.heroTitle}>
            {isLogin ? "Welcome Back!" : "Join Us Today!"}
          </h1>

          <p className={styles.heroSubtitle}>
            {isLogin
              ? "Log in to access your account \n and manage your finances."
              : "Create an account to start managing your finances with us."}
          </p>
        </div>

        {/* Forms Area */}
        <div className={styles.formsArea}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={isLogin ? "login" : "register"}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              custom={direction}
              style={{ width: "100%", height: "100%" }}
            >
              <AuthForms isLogin={isLogin} onSwap={handleSwap} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default AuthPage;
