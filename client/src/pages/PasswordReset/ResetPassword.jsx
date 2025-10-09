import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Common/Button/Button';
import InputBox from '../../components/Common/InputBox/InputBox';
import Notification from '../../components/Common/Notification/Notification';
import styles from './PasswordReset.module.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [tokenValid, setTokenValid] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    // Verify token on component mount
    const verifyToken = async () => {
      if (!token) {
        setNotification({
          type: 'error',
          message: 'Invalid or missing reset token.'
        });
        return;
      }

      try {
        // TODO: Replace with actual token verification API call
        // const response = await apiRequest(`/auth/verify-reset-token?token=${token}`);
        // setTokenValid(true);
        
        // Simulate API call
        setTimeout(() => {
          setTokenValid(true);
        }, 500);
      } catch (error) {
        setNotification({
          type: 'error',
          message: 'This password reset link is invalid or has expired. Please request a new one.'
        });
      }
    };

    verifyToken();
  }, [token]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setFormMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (password.length < 8) {
      setFormMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    setLoading(true);
    setFormMessage({ type: '', text: '' });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful response
      showNotification('success', 'Your password has been successfully reset!');
      
      // Clear form
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after delay
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
      
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Invalid Request</h2>
          <p className={styles.subtitle}>
            The password reset link is invalid or has expired.
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/auth/forgot-password')}
            className={styles.button}
          >
            Request New Reset Link
          </Button>
        </div>
      </div>
    );
  }

  if (!tokenValid && !formMessage.text) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Verifying...</h2>
          <p className={styles.subtitle}>Please wait while we verify your reset link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
      
      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h2>Create New Password</h2>
        <p className={styles.subtitle}>
          Please enter your new password below.
        </p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <InputBox
              type="password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              name="new-password"
              autoFocus
            />
            
            <div style={{ marginTop: '1rem' }}>
              <InputBox
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                name="new-password"
              />
            </div>
            
            {formMessage.text && (
              <div className={`${styles.message} ${formMessage.type === 'error' ? styles.error : styles.success}`}>
                {formMessage.text}
              </div>
            )}
          </div>

          <div className={styles.buttonGroup}>
            <Button 
              type="submit" 
              variant="primary" 
              fullWidth 
              loading={loading}
              disabled={!password || !confirmPassword || loading}
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
