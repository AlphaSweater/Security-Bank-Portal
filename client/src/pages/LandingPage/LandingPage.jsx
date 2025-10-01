// External Dependencies
import { useNavigate } from "react-router-dom";

// Components
import Button from "../../components/Common/Button/Button";
import Footer from "../../components/Footer/Footer";

// Assets
import logo from "../../assets/sbpLogo.png";

// Styles
import styles from "./LandingPage.module.css";

function LandingPage() {
  const navigate = useNavigate();
  
  const handleGetStarted = () => navigate("/auth");
  const scrollToFeatures = () => {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.wrapper}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Security Bank Portal" className={styles.logo} />
          <span className={styles.logoText}>Security Bank</span>
        </div>
        <div className={styles.navButtons}>
          <Button 
            variant="outline" 
            size="medium"
            onClick={() => navigate("/auth")}
            className={styles.navSignIn}
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1>Your <span className={styles.highlight}>Secure</span> Banking Solution</h1>
            <p className={styles.subtitle}>
              Experience banking that puts security first. Our advanced encryption and 
              multi-factor authentication keep your finances protected around the clock.
            </p>
            <div className={styles.ctaContainer}>
              <Button 
                variant="primary" 
                size="large"
                onClick={handleGetStarted}
                className={styles.ctaButton}
              >
                Get Started
              </Button>
              <button 
                onClick={scrollToFeatures}
                className={styles.secondaryCta}
              >
                Learn More
              </button>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.cardPreview}>
              <div className={styles.card}>
                <div className={styles.cardChip}></div>
                <div className={styles.cardNumber}>•••• •••• •••• 1234</div>
                <div className={styles.cardFooter}>
                  <div>
                    <div className={styles.cardLabel}>Card Holder</div>
                    <div>YOUR NAME</div>
                  </div>
                  <div>
                    <div className={styles.cardLabel}>Expires</div>
                    <div>••/••</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <h2>Why Choose Us?</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔒</div>
            <h3>Bank-Level Security</h3>
            <p>256-bit encryption and real-time fraud monitoring to protect your accounts.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3>Instant Transfers</h3>
            <p>Send and receive money instantly, 24/7, with no hidden fees.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📱</div>
            <h3>Mobile Banking</h3>
            <p>Full-featured mobile app to manage your finances on the go.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>Ready to experience better banking?</h2>
          <p>Join thousands of customers who trust us with their financial security.</p>
          <Button 
            variant="primary" 
            size="large"
            onClick={handleGetStarted}
            className={styles.ctaButton}
          >
            Open Your Account
          </Button>
        </div>
      </section>

      {/* Standard Footer */}
      <Footer />
    </div>
  );
}

export default LandingPage;
