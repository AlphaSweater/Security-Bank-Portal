// External Dependencies
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Assets
import reactLogo from "../../assets/sbpLogo.png";

// UI Components
import AuthForms from "../../components/AuthForms/AuthForms";

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
    transition: { duration: 0.44, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction) => ({
    x: direction < 0 ? 150 : -150,
    opacity: 0,
    width: "100%",
    transition: { duration: 0.18, ease: "easeInOut" },
  }),
};

// Slide-in for the whole forms area (from right)
const formsAreaSlideIn = {
  initial: { x: -600, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 1.88, ease: [0.22, 1, 0.36, 1] },
  },
};

// Zoom-in animation for AuthPage root
const zoomInVariants = {
  initial: { scale: 0.92, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// Default Function Export
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [direction, setDirection] = useState(-1); // 1 → right, -1 → left
  const [showForm, setShowForm] = useState(false);

  const handleSwap = () => {
    setDirection(isLogin ? -1 : 1);
    setIsLogin((v) => !v);
  };

  return (
    <motion.section
      className={styles.page}
      variants={zoomInVariants}
      initial="initial"
      animate="animate"
      onAnimationComplete={() => setShowForm(true)}
    >
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
        {/* Forms Area (inlined) */}
        <motion.div
          className={styles.formsArea}
          variants={formsAreaSlideIn}
          initial="initial"
          animate={showForm ? "animate" : false}
        >
          {showForm && (
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
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}

export default AuthPage;
