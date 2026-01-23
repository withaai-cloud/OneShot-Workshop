import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, Truck, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';
import './Welcome.css';

function Welcome() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Package size={32} />,
      title: 'Stock Management',
      description: 'Track inventory with FIFO and Weighted Average costing. Manage suppliers and monitor stock levels in real-time.'
    },
    {
      icon: <FileText size={32} />,
      title: 'Job Cards',
      description: 'Create detailed job cards for maintenance and repairs. Track labor costs and parts used for accurate billing.'
    },
    {
      icon: <Truck size={32} />,
      title: 'Asset Tracking',
      description: 'Manage your fleet of vehicles, trailers, and equipment. Keep track of maintenance history and costs.'
    },
    {
      icon: <BarChart3 size={32} />,
      title: 'Reports & Analytics',
      description: 'Generate comprehensive reports on stock usage, expenses, and job card profitability.'
    }
  ];

  const benefits = [
    'Cloud-based - Access from anywhere',
    'Multi-user support',
    'Real-time inventory updates',
    'Purchase invoice tracking',
    'Expense management',
    'Free to get started'
  ];

  return (
    <div className="home-container">
      {/* Navigation */}
      <nav className="home-nav">
        <div className="nav-content">
          <img 
            src={process.env.PUBLIC_URL + "/header.png"} 
            alt="OneShot Workshop" 
            className="nav-logo"
          />
          <div className="nav-buttons">
            <button 
              className="btn-secondary"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button 
              className="btn-primary"
              onClick={() => navigate('/register')}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Workshop Management
            <span className="hero-highlight"> Made Simple</span>
          </h1>
          <p className="hero-description">
            Complete workshop management solution for vehicle maintenance businesses. 
            Track stock, manage job cards, monitor assets, and generate reports - all in one place.
          </p>
          <div className="hero-buttons">
            <button 
              className="btn-hero-primary"
              onClick={() => navigate('/register')}
            >
              Start Free Trial
              <ArrowRight size={20} />
            </button>
            <button 
              className="btn-hero-secondary"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
          <p className="hero-note">
            No credit card required • Free forever for small workshops
          </p>
        </div>
        <div className="hero-image">
          <div className="mockup-window">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="mockup-content">
              <img 
                src={process.env.PUBLIC_URL + "/home.png"} 
                alt="Dashboard Preview" 
                className="dashboard-preview"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Everything You Need to Run Your Workshop</h2>
          <p className="section-subtitle">
            Powerful features designed specifically for vehicle maintenance businesses
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-content">
          <h2 className="benefits-title">Why OneShot Workshop Manager?</h2>
          <div className="benefits-list">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-item">
                <CheckCircle size={24} className="benefit-icon" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="benefits-image">
          <div className="stats-card">
            <div className="stat">
              <div className="stat-value">10x</div>
              <div className="stat-label">Faster Operations</div>
            </div>
            <div className="stat">
              <div className="stat-value">100%</div>
              <div className="stat-label">Cloud Backup</div>
            </div>
            <div className="stat">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Access Anywhere</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Streamline Your Workshop?</h2>
          <p className="cta-description">
            Join workshops across South Africa using OneShot to manage their operations efficiently.
          </p>
          <button 
            className="btn-cta"
            onClick={() => navigate('/register')}
          >
            Get Started Free
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img 
              src={process.env.PUBLIC_URL + "/header.png"} 
              alt="OneShot Workshop" 
              className="footer-logo"
            />
            <p>Complete workshop management for South African businesses</p>
          </div>
          <div className="footer-links">
            <div className="footer-section">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#support">Support</a>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <a href="#about">About Us</a>
              <a href="#contact">Contact</a>
              <a href="#privacy">Privacy Policy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 OneShot Workshop Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Welcome;