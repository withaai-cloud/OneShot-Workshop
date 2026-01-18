import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Get stored users
    const users = JSON.parse(localStorage.getItem('workshopUsers') || '[]');
    
    // Find user
    const user = users.find(u => u.email === formData.email);
    
    if (!user) {
      setError('Email not found. Please register first.');
      return;
    }
    
    if (user.password !== formData.password) {
      setError('Incorrect password. Please try again.');
      return;
    }
    
    // Set current user
    localStorage.setItem('currentUser', JSON.stringify(user));
    onLogin(user);
    navigate('/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="auth-background" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/home.png)` }}></div>
      <div className="auth-overlay"></div>

      <div className="auth-card" style={{ position: 'relative', zIndex: 1, margin: '0 auto' }}>
        <div className="auth-header">
          <img src={process.env.PUBLIC_URL + "/header.png"} alt="OneShot Workshop" className="auth-logo" />
          <h2>Welcome Back</h2>
          <p>Sign in to manage your workshop</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={20} />
              <input
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn">
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <button onClick={() => navigate('/register')} className="auth-link">Register here</button></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
