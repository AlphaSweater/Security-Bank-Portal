import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/Common/Button/Button';
import InputBox from '../../components/Common/InputBox/InputBox';
import styles from './PasswordReset.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // TODO: Replace with actual API call
      // const response = await apiRequest('/auth/forgot-password', 'POST', { email });
      // setMessage({ type: 'success', text: 'If an account exists with this email, you will receive a password reset link.' });
      
      // Simulate API call
      setTimeout(() => {
        setMessage({ 
          type: 'success', 
          text: 'If an account exists with this email, you will receive a password reset link.' 
        });
        setLoading(false);
      }, 1500);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'An error occurred. Please try again.' 
      });
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.card}>
        <h2>Reset Your Password</h2>
        <p className={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <InputBox
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          {message.text && (
            <div className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>
              {message.text}
            </div>
          )}

          <div className={styles.buttonGroup}>
            <Button 
              type="submit" 
              variant="primary" 
              fullWidth 
              loading={loading}
              disabled={!email || loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            
            <Button 
              type="button" 
              variant="text" 
              onClick={() => navigate('/auth')}
              className={styles.backButton}
            >
              Back to Login
            </Button>
            
            {/* Test button - remove in production */}
            <Button 
              type="button"
              variant="outline"
              onClick={() => navigate('/auth/reset-password?token=test')}
              style={{ marginTop: '1rem' }}
              fullWidth
            >
              Test Reset Password Page
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;
