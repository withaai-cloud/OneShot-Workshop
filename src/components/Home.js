import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, Truck, BarChart3, Building2 } from 'lucide-react';

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Package,
      title: 'Stock Management',
      description: 'Track inventory, quantities, and costs with low stock alerts',
      path: '/stock',
      color: '#ff7a59'
    },
    {
      icon: FileText,
      title: 'Job Cards',
      description: 'Create work orders and track parts used per asset',
      path: '/job-cards',
      color: '#ff7a59'
    },
    {
      icon: Truck,
      title: 'Asset Tracking',
      description: 'Manage vehicles, trailers, and implements with expense tracking',
      path: '/assets',
      color: '#ff7a59'
    },
    {
      icon: Building2,
      title: 'Supplier Management',
      description: 'Track suppliers and monitor purchases by vendor',
      path: '/suppliers',
      color: '#ff7a59'
    },
    {
      icon: BarChart3,
      title: 'Reports & Analytics',
      description: 'View detailed reports and export data for analysis',
      path: '/reports',
      color: '#ff7a59'
    }
  ];

  return (
    <div className="home-container">
      <div className="home-hero">
        <img src={process.env.PUBLIC_URL + "/home.png"} alt="OneShot Workshop" className="home-logo" />
        <h1>Workshop Management System</h1>
        <p className="home-subtitle">
          Streamline your workshop operations with comprehensive expense tracking, 
          inventory management, and asset maintenance monitoring.
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="feature-card"
            onClick={() => navigate(feature.path)}
          >
            <div className="feature-icon" style={{ backgroundColor: `${feature.color}15`, color: feature.color }}>
              <feature.icon size={32} />
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <button className="feature-btn">Get Started →</button>
          </div>
        ))}
      </div>

      <div className="quick-stats-home">
        <h2>Why Choose OneShot Workshop?</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <span className="benefit-number">✓</span>
            <div>
              <h4>Real-time Tracking</h4>
              <p>Monitor stock levels and expenses instantly</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-number">✓</span>
            <div>
              <h4>Multi-Currency</h4>
              <p>Support for ZAR, USD, EUR, and GBP</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-number">✓</span>
            <div>
              <h4>Data Backup</h4>
              <p>Export and import your data anytime</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-number">✓</span>
            <div>
              <h4>Comprehensive Reports</h4>
              <p>Detailed analytics and CSV exports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="home-cta">
        <h2>Ready to Get Started?</h2>
        <p>Begin by adding your assets and stock items</p>
        <div className="cta-buttons">
          <button className="btn btn-primary" onClick={() => navigate('/assets')}>
            Add Assets
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/stock')}>
            Add Stock
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
