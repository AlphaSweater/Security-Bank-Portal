import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./LoginRegister.module.css";
import LoginForm from "../components/Auth/LoginForm";
import RegisterForm from "../components/Auth/RegisterForm";

const slideVariants = {
  initial: (direction) => ({
    x: direction > 0 ? 150 : -150,
    opacity: 0,
    position: "absolute",
  }),
  animate: {
    x: 0,
    opacity: 1,
    position: "relative",
    transition: { duration: 0.18, ease: "easeInOut" },
  },
  exit: (direction) => ({
    x: direction < 0 ? 150 : -150,
    opacity: 0,
    position: "absolute",
    transition: { duration: 0.18, ease: "easeInOut" },
  }),
};

function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [direction, setDirection] = useState(1); // 1 → right, -1 → left

  const handleSwap = () => {
    setDirection(isLogin ? 1 : -1);
    setIsLogin((v) => !v);
  };

  return (
    <section className={styles.page}>
      <div
        className={styles.formStack}
        style={{ position: "relative", minHeight: 320 }}
      >
        <AnimatePresence custom={direction} mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              custom={direction}
              style={{ width: "100%" }}
            >
              <LoginForm onSwap={handleSwap} isLogin={isLogin} />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              custom={direction}
              style={{ width: "100%" }}
            >
              <RegisterForm onSwap={handleSwap} isLogin={isLogin} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default LoginRegister;
