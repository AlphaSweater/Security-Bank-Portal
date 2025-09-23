// External Dependencies
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Assets

// UI Components
import AuthForms from "components/AuthForms";

// Styles
import styles from "./AuthPage.module.css";

// Animation Variants
const slideVariants = {
  initial: (direction) => ({
    x: direction > 0 ? 150 : -150,
    opacity: 0,
    position: "absolute",
    width: "100%",
    top: 0,
    left: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    position: "absolute",
    width: "100%",
    top: 0,
    left: 0,
    transition: { duration: 0.18, ease: "easeInOut" },
  },
  exit: (direction) => ({
    x: direction < 0 ? 150 : -150,
    opacity: 0,
    position: "absolute",
    width: "100%",
    top: 0,
    left: 0,
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
      <div className={styles.formArea}>
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={isLogin ? "login" : "register"}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            custom={direction}
            style={{ width: "100%", position: "absolute", top: 0, left: 0 }}
          >
            <AuthForms isLogin={isLogin} onSwap={handleSwap} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export default AuthPage;
