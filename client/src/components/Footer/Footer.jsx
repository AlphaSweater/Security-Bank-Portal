import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import logo from '../../assets/sbpLogo.png';

const Footer = () => {
  return (
    <div className={styles.footerWrapper}>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <img src={logo} alt="Security Bank Portal" className={styles.logo} />
            <span>Security Bank</span>
          </div>
          <div className={styles.footerLinks}>
            <Link className={styles.footerLink}>Privacy Policy</Link>
            <Link className={styles.footerLink}>Terms of Service</Link>
            <Link className={styles.footerLink}>Security</Link>
            <Link className={styles.footerLink}>Contact Us</Link>
          </div>
          <div className={styles.copyrightContainer}>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} Security Bank. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
