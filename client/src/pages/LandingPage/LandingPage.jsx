// External Dependencies
import { useNavigate } from "react-router-dom";
import { FiShield, FiZap, FiCreditCard, FiSmartphone, FiLock, FiGlobe } from 'react-icons/fi';

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

  const features = [
    {
      icon: <FiShield size={32} />,
      title: "Bank-Level Security",
      description: "256-bit encryption and real-time fraud monitoring to protect your accounts."
    },
    {
      icon: <FiZap size={32} />,
      title: "Lightning Fast Transfers",
      description: "Instant money transfers that take seconds, not hours."
    },
    {
      icon: <FiCreditCard size={32} />,
      title: "Virtual Cards",
      description: "Generate secure virtual cards for online shopping."
    },
    {
      icon: <FiSmartphone size={32} />,
      title: "Mobile Banking",
      description: "Full banking capabilities right at your fingertips."
    },
    {
      icon: <FiLock size={32} />,
      title: "Biometric Login",
      description: "Secure access with fingerprint or face recognition."
    },
    {
      icon: <FiGlobe size={32} />,
      title: "Global Support",
      description: "24/7 customer support, no matter where you are."
    }
  ];

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
        <div className={styles.heroGradient}></div>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1>Banking <span className={styles.highlight}>Reimagined</span> for the Digital Age</h1>
            <p className={styles.subtitle}>
              Experience the future of secure banking with our cutting-edge platform. 
              Where advanced security meets unparalleled convenience.
            </p>
            <div className={styles.ctaContainer}>
              <Button 
                variant="primary" 
                size="large"
                onClick={handleGetStarted}
                className={styles.ctaButton}
              >
                Open Account
              </Button>
              <button 
                onClick={scrollToFeatures}
                className={styles.secondaryCta}
              >
                <span>Learn More</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className={styles.trustBadges}>
              <div className={styles.trustBadge}>
                <div className={styles.checkmark}>✓</div>
                <span>256-bit Encryption</span>
              </div>
              <div className={styles.trustBadge}>
                <div className={styles.checkmark}>✓</div>
                <span>Fully Licensed</span>
              </div>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.cardPreview}>
              <div className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardChip}></div>
                  <div className={styles.cardLogo}>
                    <img src={logo} alt="Security Bank" />
                  </div>
                </div>
                <div className={styles.cardNumber}>•••• •••• •••• 1234</div>
                <div className={styles.cardFooter}>
                  <div>
                    <div className={styles.cardLabel}>Card Holder</div>
                    <div className={styles.cardValue}>YOUR NAME</div>
                  </div>
                  <div>
                    <div className={styles.cardLabel}>Expires</div>
                    <div className={styles.cardValue}>••/••</div>
                  </div>
                </div>
                <div className={styles.cardGlow}></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.container}>
          <h2>Why Choose Security Bank?</h2>
          <p className={styles.sectionSubtitle}>Experience banking that works as hard as you do</p>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2>Ready to get started?</h2>
          <p>Join thousands of customers who trust us with their banking needs.</p>
          <Button 
            variant="primary" 
            size="large"
            onClick={handleGetStarted}
            className={styles.ctaButton}
          >
            Open Your Account - It's Free
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;
